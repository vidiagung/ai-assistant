import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createStreamingResponse, DEFAULT_SYSTEM_PROMPT } from '@/lib/gemini'

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
					model: model ?? 'gemini-2.5-flash',
					systemPrompt: systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
				},
			} )
		}

		const userMessage = await prisma.message.create( {
			data: {
				conversationId: conversation.id,
				role: 'user',
				content: message,
			},
		} )

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
		const convId = conversation.id

		const readableStream = new ReadableStream( {
			async start( controller ) {
				controller.enqueue(
					encoder.encode(
						`data: ${JSON.stringify( { type: 'init', conversationId: convId, userMessageId: userMessage.id } )}\n\n`
					)
				)

				let assistantContent = ''

				try {
					for await ( const chunk of stream as AsyncIterable<{ text: () => string }> ) {
						const text = chunk.text()
						if ( text ) {
							assistantContent += text
							controller.enqueue(
								encoder.encode( `data: ${JSON.stringify( { type: 'text', text } )}\n\n` )
							)
						}
					}

					const assistantMsg = await prisma.message.create( {
						data: {
							conversationId: convId,
							role: 'assistant',
							content: assistantContent,
						},
					} )

					controller.enqueue(
						encoder.encode(
							`data: ${JSON.stringify( { type: 'done', messageId: assistantMsg.id } )}\n\n`
						)
					)
				} catch ( err ) {
					const error = err as Error
					controller.enqueue(
						encoder.encode( `data: ${JSON.stringify( { type: 'error', error: error.message } )}\n\n` )
					)
				} finally {
					controller.close()
				}
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