import { Anthropic } from "@anthropic-ai/sdk"
import AureloSDK, { type AureloStorage, type AureloStreamEvent } from "aurelo.ai"

import {
	ApiHandlerOptions,
	aureloDefaultModelId,
	aureloModelInfoSaneDefaults,
	aureloModels,
	ModelInfo,
} from "../../shared/api"

import { ApiStream, ApiStreamUsageChunk } from "../transform/stream"
import { BaseProvider } from "./base-provider"
import { SingleCompletionHandler } from "../index"

const runtimeStorageValues = new Map<string, string>()

const runtimeStorage: AureloStorage = {
	get: (key) => runtimeStorageValues.get(key) || null,
	set: (key, value) => {
		runtimeStorageValues.set(key, value)
	},
	delete: (key) => {
		runtimeStorageValues.delete(key)
	},
}

// A content part sent to Aurelo: either plain text or a native Anthropic image block.
// Text and tool blocks are flattened to strings (the gateway converts them to input_text anyway).
// Image blocks are preserved as-is so the gateway can convert them to input_image for OpenAI.
type AureloContentPart = { type: "text"; text: string } | Anthropic.Messages.ImageBlockParam

type AureloInputMessage = {
	role: "system" | "user" | "assistant"
	content: string | AureloContentPart[]
}

export class AureloHandler extends BaseProvider implements SingleCompletionHandler {
	private readonly options: ApiHandlerOptions
	private readonly client: AureloSDK
	private lastSystemPrompt: string | null = null

	constructor(options: ApiHandlerOptions) {
		super()
		this.options = options

		if (!options.aureloApiKey) {
			throw new Error("Aurelo API key not found.")
		}

		this.client = new AureloSDK({
			apiKey: options.aureloApiKey,
			baseUrl: options.aureloBaseUrl || "https://aurelo.tech",
			storage: runtimeStorage,
		})
	}

	override async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const model = this.getModel().id
		let sawTextDelta = false
		let doneText = ""

		// Detect system prompt changes (mode switch, MCP server connect/disconnect, etc.)
		// Signal the gateway via rotateReason in metadata — gateway responds with
		// rotateSession: true, SDK retries with full sessionStartInput (new system prompt).
		const systemPromptChanged = this.lastSystemPrompt !== null && this.lastSystemPrompt !== systemPrompt
		this.lastSystemPrompt = systemPrompt

		for await (const event of this.client.streamResponse({
			model,
			sessionStartInput: buildFullContextInput(systemPrompt, messages),
			latestInput: buildLatestInput(messages),
			metadata: {
				source: "pearai-roo-code",
				model,
				...(systemPromptChanged && { rotateReason: "system_prompt_changed" }),
			},
		})) {
			const chunk = parseAureloStreamEvent(event, sawTextDelta)

			if (chunk?.type === "text") {
				sawTextDelta = true
				doneText += chunk.text
			}

			if (chunk) {
				yield chunk
			}
		}

		if (!sawTextDelta && doneText) {
			yield {
				type: "text",
				text: doneText,
			}
		}
	}

	override getModel(): { id: string; info: ModelInfo } {
		const modelId = this.options.apiModelId || aureloDefaultModelId
		return {
			id: modelId,
			info: aureloModels[modelId as keyof typeof aureloModels] || aureloModelInfoSaneDefaults,
		}
	}

	async completePrompt(prompt: string): Promise<string> {
		let text = ""
		for await (const event of this.client.streamResponse({
			model: this.getModel().id,
			sessionStartInput: prompt,
			latestInput: prompt,
			metadata: {
				source: "pearai-roo-code",
				mode: "single_completion",
			},
		})) {
			const chunk = parseAureloStreamEvent(event, false)
			if (chunk?.type === "text") {
				text += chunk.text
			}
		}
		return text
	}
}

function buildFullContextInput(
	systemPrompt: string,
	messages: Anthropic.Messages.MessageParam[],
): AureloInputMessage[] {
	return [
		{
			role: "system",
			content: systemPrompt,
		},
		...messages.map((message) => ({
			role: message.role,
			content: buildAureloContent(message.content),
		})),
	]
}

function buildLatestInput(messages: Anthropic.Messages.MessageParam[]): AureloInputMessage[] {
	const latestMessage = messages[messages.length - 1]
	if (!latestMessage) {
		return []
	}

	return [
		{
			role: latestMessage.role,
			content: buildAureloContent(latestMessage.content),
		},
	]
}

/**
 * Converts an Anthropic message content block into the format the Aurelo SDK accepts.
 *
 * - If the message has no images: returns a flat string (text + tool context joined).
 *   The Responses API converts these to input_text anyway, so flattening is harmless.
 * - If the message has images: returns a mixed AureloContentPart[] where:
 *   - All text, tool_use, and tool_result blocks are grouped into { type: "text" } parts
 *   - Image blocks are preserved as Anthropic ImageBlockParam so the gateway can convert
 *     them into proper { type: "input_image", image_url: "data:..." } parts for OpenAI.
 */
function buildAureloContent(content: Anthropic.Messages.MessageParam["content"]): string | AureloContentPart[] {
	if (typeof content === "string") {
		return content
	}

	const hasImages = content.some((block) => block.type === "image")

	if (!hasImages) {
		// No images — flatten everything to a plain string, same as before.
		return content
			.map((block) => {
				if (block.type === "text") return block.text
				if (block.type === "tool_use") {
					return `[Tool Call: ${block.name}]\n${JSON.stringify(block.input, null, 2)}`
				}
				if (block.type === "tool_result") {
					if (typeof block.content === "string") return `[Tool Result]: ${block.content}`
					if (Array.isArray(block.content)) {
						return `[Tool Result]: ${block.content
							.map((p) => (p.type === "text" ? p.text : ""))
							.filter(Boolean)
							.join("\n")}`
					}
				}
				return ""
			})
			.filter(Boolean)
			.join("\n")
	}

	// Has images — build a mixed array, grouping consecutive non-image blocks into
	// a single text part and keeping each image block as a native Anthropic ImageBlockParam.
	const parts: AureloContentPart[] = []
	let pendingText: string[] = []

	const flushText = () => {
		const text = pendingText.filter(Boolean).join("\n")
		if (text) {
			parts.push({ type: "text", text })
		}
		pendingText = []
	}

	for (const block of content) {
		if (block.type === "image") {
			flushText()
			parts.push(block) // preserved natively — gateway converts to input_image
		} else if (block.type === "text") {
			pendingText.push(block.text)
		} else if (block.type === "tool_use") {
			pendingText.push(`[Tool Call: ${block.name}]\n${JSON.stringify(block.input, null, 2)}`)
		} else if (block.type === "tool_result") {
			if (typeof block.content === "string") {
				pendingText.push(`[Tool Result]: ${block.content}`)
			} else if (Array.isArray(block.content)) {
				const resultText = block.content
					.map((p) => (p.type === "text" ? p.text : ""))
					.filter(Boolean)
					.join("\n")
				if (resultText) pendingText.push(`[Tool Result]: ${resultText}`)
			}
		}
	}
	flushText()

	return parts
}

function parseAureloStreamEvent(
	event: AureloStreamEvent,
	ignoreDoneText: boolean,
): { type: "text"; text: string } | { type: "reasoning"; text: string } | ApiStreamUsageChunk | null {
	if (event.type === "comment") {
		return parseUsageComment(event.comment || "")
	}

	if (event.type !== "event") {
		return null
	}

	const data = event.data
	if (!data || typeof data !== "object") {
		return null
	}

	const payload = data as Record<string, any>
	const type = String(payload.type || "")

	if (type === "error") {
		const message = payload.error?.message || payload.message || "Aurelo request failed"
		throw new Error(message)
	}

	if (type === "response.output_text.delta" && typeof payload.delta === "string") {
		return {
			type: "text",
			text: payload.delta,
		}
	}

	if (!ignoreDoneText && type === "response.output_text.done" && typeof payload.text === "string") {
		return {
			type: "text",
			text: payload.text,
		}
	}

	if (type.includes("reasoning") && typeof payload.delta === "string") {
		return {
			type: "reasoning",
			text: payload.delta,
		}
	}

	const usage = payload.usage || payload.response?.usage
	if (usage) {
		return parseUsageObject(usage)
	}

	return null
}

function parseUsageComment(comment: string): ApiStreamUsageChunk | null {
	const match = comment.match(/\bUsage:\s*input=(\d+)\s+cached=(\d+)\s+output=(\d+)/)
	if (!match) {
		return null
	}

	return {
		type: "usage",
		inputTokens: Number(match[1]) || 0,
		cacheReadTokens: Number(match[2]) || 0,
		outputTokens: Number(match[3]) || 0,
	}
}

function parseUsageObject(usage: Record<string, any>): ApiStreamUsageChunk {
	return {
		type: "usage",
		inputTokens: Number(usage.input_tokens ?? usage.prompt_tokens ?? 0) || 0,
		outputTokens: Number(usage.output_tokens ?? usage.completion_tokens ?? 0) || 0,
		cacheWriteTokens: Number(usage.input_tokens_details?.cache_creation_tokens ?? 0) || undefined,
		cacheReadTokens: Number(usage.input_tokens_details?.cached_tokens ?? 0) || undefined,
	}
}
