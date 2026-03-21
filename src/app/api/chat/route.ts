import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createStreamingResponse, DEFAULT_SYSTEM_PROMPT } from '@/lib/anthropic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST( req: NextRequest ) {
	try {
		const { message, conversationId, model, systemPrompt } = await req.json()

		if ( !message?.trim() ) {
			return Response.json( { error: 'Message is required' }, { status: 400 } )
		}

		let conversation
		let prevMessages: { role: string; content: string }[] = []

		if ( conversationId ) {
			conversation = await prisma.conversation.findUnique( {
				where: { id: conversationId },
				include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
			} )
			if ( !conversation ) {
				return Response.json( { error: 'Conversation not found' }, { status: 404 } )
			}
			prevMessages = conversation.messages
				.filter( ( m ) => m.role !== 'system' )
				.map( ( m ) => ( { role: m.role, content: m.content } ) )
		} else {
			conversation = await prisma.conversation.create( {
				data: {
					title: message.slice( 0, 60 ) + ( message.length > 60 ? '...' : '' ),
					model: model ?? 'claude-sonnet-4-20250514',
					systemPrompt: systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
				},
			} )
		}

		// Save user message
		const userMessage = await prisma.message.create( {
			data: {
				conversationId: conversation.id,
				role: 'user',
				content: message,
			},
		} )

		// Build history
		const history: { role: 'user' | 'assistant'; content: string }[] = [
			...prevMessages.map( ( m ) => ( {
				role: m.role as 'user' | 'assistant',
				content: m.content,
			} ) ),
			{ role: 'user', content: message },
		]

		const stream = await createStreamingResponse( history, {
			model: conversation.model,
			systemPrompt: conversation.systemPrompt ?? undefined,
		} )

		const encoder = new TextEncoder()
		let assistantContent = ''
		const convId = conversation.id

		const readableStream = new ReadableStream( {
			async start( controller ) {
				controller.enqueue(
					encoder.encode(
						`data: ${JSON.stringify( { type: 'init', conversationId: convId, userMessageId: userMessage.id } )}\n\n`
					)
				)

				stream.on( 'text', ( text ) => {
					assistantContent += text
					controller.enqueue(
						encoder.encode( `data: ${JSON.stringify( { type: 'text', text } )}\n\n` )
					)
				} )

				stream.on( 'message', async ( msg ) => {
					const assistantMsg = await prisma.message.create( {
						data: {
							conversationId: convId,
							role: 'assistant',
							content: assistantContent,
							inputTokens: msg.usage.input_tokens,
							outputTokens: msg.usage.output_tokens,
						},
					} )

					controller.enqueue(
						encoder.encode(
							`data: ${JSON.stringify( { type: 'done', messageId: assistantMsg.id, inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens } )}\n\n`
						)
					)
					controller.close()
				} )

				stream.on( 'error', ( err ) => {
					controller.enqueue(
						encoder.encode( `data: ${JSON.stringify( { type: 'error', error: err.message } )}\n\n` )
					)
					controller.close()
				} )
			},
		} )

		return new Response( readableStream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		} )
	} catch ( error ) {
		console.error( '[/api/chat] Error:', error )
		return Response.json( { error: 'Internal server error' }, { status: 500 } )
	}
}