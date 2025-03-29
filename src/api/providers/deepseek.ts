import { Anthropic } from "@anthropic-ai/sdk"
import { ApiHandlerOptions, ModelInfo, deepSeekModels, deepSeekDefaultModelId } from "../../shared/api"
import { ApiHandler, SingleCompletionHandler } from "../index"
import { convertToR1Format } from "../transform/r1-format"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"

interface DeepSeekUsage {
	prompt_tokens: number
	completion_tokens: number
	prompt_cache_miss_tokens?: number
	prompt_cache_hit_tokens?: number
}

export class DeepSeekHandler implements ApiHandler, SingleCompletionHandler {
	private options: ApiHandlerOptions

	constructor(options: ApiHandlerOptions) {
		if (!options.deepSeekApiKey) {
			throw new Error("DeepSeek API key is required. Please provide it in the settings.")
		}
		this.options = options
	}

	private get baseUrl(): string {
		return this.options.deepSeekBaseUrl ?? "https://api.deepseek.com/v1"
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const modelInfo = this.getModel().info
		const modelId = this.options.apiModelId ?? deepSeekDefaultModelId
		const isReasoner = modelId.includes("deepseek-reasoner")

		const systemMessage = { role: "system", content: systemPrompt }
		const formattedMessages = isReasoner
			? convertToR1Format([{ role: "user", content: systemPrompt }, ...messages])
			: [systemMessage, ...convertToOpenAiMessages(messages)]

		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.options.deepSeekApiKey}`,
				"creator-mode": String(this.options.creatorMode),
			},
			body: JSON.stringify({
				model: modelId,
				messages: formattedMessages,
				temperature: 0,
				stream: true,
				max_tokens: modelInfo.maxTokens,
			}),
		})

		if (!response.ok) {
			throw new Error(`DeepSeek API error: ${response.statusText}`)
		}

		if (!response.body) {
			throw new Error("No response body received from DeepSeek API")
		}

		const reader = response.body.getReader()
		const decoder = new TextDecoder()
		let buffer = ""

		try {
			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })
				const lines = buffer.split("\n")
				buffer = lines.pop() || ""

				for (const line of lines) {
					if (line.trim() === "") continue
					if (!line.startsWith("data: ")) continue

					const data = line.slice(6)
					if (data === "[DONE]") continue

					try {
						const chunk = JSON.parse(data)
						// Handle regular delta format
						const delta = chunk.choices[0]?.delta ?? {}
						if (delta.type === "ui") {
							yield {
								type: "text",
								text: delta.metadata?.content || "",
								metadata: delta.metadata,
							}
						} else if (delta.content) {
							yield {
								type: "text",
								text: delta.content,
							}
						}

						if ("reasoning_content" in delta && delta.reasoning_content) {
							yield {
								type: "reasoning",
								text: delta.reasoning_content,
							}
						}

						if (chunk.usage) {
							const usage = chunk.usage as DeepSeekUsage
							let inputTokens = (usage.prompt_tokens || 0) - (usage.prompt_cache_hit_tokens || 0)
							yield {
								type: "usage",
								inputTokens: inputTokens,
								outputTokens: usage.completion_tokens || 0,
								cacheReadTokens: usage.prompt_cache_hit_tokens || 0,
								cacheWriteTokens: usage.prompt_cache_miss_tokens || 0,
							}
						}
					} catch (error) {
						console.error("Error parsing DeepSeek response:", error)
					}
				}
			}
		} finally {
			reader.releaseLock()
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		const modelId = this.options.apiModelId ?? deepSeekDefaultModelId
		return {
			id: modelId,
			info: deepSeekModels[modelId as keyof typeof deepSeekModels] || deepSeekModels[deepSeekDefaultModelId],
		}
	}

	async completePrompt(prompt: string): Promise<string> {
		try {
			const response = await fetch(`${this.baseUrl}/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.options.deepSeekApiKey}`,
					"creator-mode": String(this.options.creatorMode),
				},
				body: JSON.stringify({
					model: this.getModel().id,
					messages: [{ role: "user", content: prompt }],
					temperature: 0,
					stream: false,
				}),
			})

			if (!response.ok) {
				throw new Error(`DeepSeek API error: ${response.statusText}`)
			}

			const data = await response.json()
			return data.choices[0]?.message?.content || ""
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`DeepSeek completion error: ${error.message}`)
			}
			throw error
		}
	}
}
