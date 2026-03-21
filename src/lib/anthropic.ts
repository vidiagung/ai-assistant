import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic( {
	apiKey: process.env.ANTHROPIC_API_KEY,
} )

export const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
export const DEFAULT_MAX_TOKENS = 4096

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. You provide clear, accurate, and thoughtful responses.`

export type MessageParam = {
	role: 'user' | 'assistant'
	content: string
}

export async function createStreamingResponse(
	messages: MessageParam[],
	options?: {
		model?: string
		maxTokens?: number
		systemPrompt?: string
	}
) {
	return anthropic.messages.stream( {
		model: options?.model ?? DEFAULT_MODEL,
		max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
		system: options?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
		messages,
	} )
}