export type ApiStream = AsyncGenerator<ApiStreamChunk>
export type ApiStreamChunk = ApiStreamTextChunk | ApiStreamUsageChunk | ApiStreamReasoningChunk

export interface ApiStreamTextChunk {
	type: "text"
	text: string
	metadata?: {
		ui_only?: boolean
		content?: string
	}
}

export interface ApiStreamReasoningChunk {
	type: "reasoning"
	text: string
}

export interface ApiStreamUsageChunk {
	type: "usage"
	inputTokens: number
	outputTokens: number
	cacheWriteTokens?: number
	cacheReadTokens?: number
	totalCost?: number // openrouter
}
