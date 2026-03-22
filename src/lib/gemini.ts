import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI( process.env.GEMINI_API_KEY! )

export const DEFAULT_MODEL = 'gemini-2.5-flash'
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. You provide clear, accurate, and thoughtful responses.`

export type MessageParam = {
	role: 'user' | 'assistant'
	content: string
}

export async function createStreamingResponse(
	messages: MessageParam[],
	options?: {
		model?: string
		systemPrompt?: string
	}
) {
	const model = genAI.getGenerativeModel( {
		model: options?.model ?? DEFAULT_MODEL,
		systemInstruction: options?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
	} )

	const history = messages.slice( 0, -1 ).map( ( m ) => ( {
		role: m.role === 'assistant' ? 'model' : 'user',
		parts: [{ text: m.content }],
	} ) )

	const lastMessage = messages[messages.length - 1].content

	const chat = model.startChat( { history } )
	const result = await chat.sendMessageStream( lastMessage )
	return result.stream
}