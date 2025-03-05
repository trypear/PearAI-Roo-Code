import { DeepSeekHandler } from "../deepseek"
import { ApiHandlerOptions, deepSeekDefaultModelId } from "../../../shared/api"
import { Anthropic } from "@anthropic-ai/sdk"

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockReadableStream = (chunks: any[]) => {
	let index = 0
	return new ReadableStream({
		pull(controller) {
			if (index >= chunks.length) {
				controller.close()
				return
			}
			const chunk = chunks[index++]
			controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`))
		},
	})
}

describe("DeepSeekHandler", () => {
	let handler: DeepSeekHandler
	let mockOptions: ApiHandlerOptions

	beforeEach(() => {
		mockOptions = {
			deepSeekApiKey: "test-api-key",
			apiModelId: "deepseek-chat",
			deepSeekBaseUrl: "https://api.deepseek.com/v1",
		}
		handler = new DeepSeekHandler(mockOptions)
		mockFetch.mockClear()
	})

	describe("constructor", () => {
		it("should initialize with provided options", () => {
			expect(handler).toBeInstanceOf(DeepSeekHandler)
			expect(handler.getModel().id).toBe(mockOptions.apiModelId)
		})

		it("should throw error if API key is missing", () => {
			expect(() => {
				new DeepSeekHandler({
					...mockOptions,
					deepSeekApiKey: undefined,
				})
			}).toThrow("DeepSeek API key is required")
		})

		it("should use default model ID if not provided", () => {
			const handlerWithoutModel = new DeepSeekHandler({
				...mockOptions,
				apiModelId: undefined,
			})
			expect(handlerWithoutModel.getModel().id).toBe(deepSeekDefaultModelId)
		})

		it("should use default base URL if not provided", () => {
			const handlerWithoutBaseUrl = new DeepSeekHandler({
				...mockOptions,
				deepSeekBaseUrl: undefined,
			})
			expect(handlerWithoutBaseUrl).toBeInstanceOf(DeepSeekHandler)
		})
	})

	describe("getModel", () => {
		it("should return model info for valid model ID", () => {
			const model = handler.getModel()
			expect(model.id).toBe(mockOptions.apiModelId)
			expect(model.info).toBeDefined()
			expect(model.info.maxTokens).toBe(8192)
			expect(model.info.contextWindow).toBe(64_000)
			expect(model.info.supportsImages).toBe(false)
			expect(model.info.supportsPromptCache).toBe(true)
		})

		it("should return provided model ID with default model info if model does not exist", () => {
			const handlerWithInvalidModel = new DeepSeekHandler({
				...mockOptions,
				apiModelId: "invalid-model",
			})
			const model = handlerWithInvalidModel.getModel()
			expect(model.id).toBe("invalid-model") // Returns provided ID
			expect(model.info).toBeDefined()
			expect(model.info).toBe(handler.getModel().info) // But uses default model info
		})

		it("should return default model if no model ID is provided", () => {
			const handlerWithoutModel = new DeepSeekHandler({
				...mockOptions,
				apiModelId: undefined,
			})
			const model = handlerWithoutModel.getModel()
			expect(model.id).toBe(deepSeekDefaultModelId)
			expect(model.info).toBeDefined()
		})
	})

	describe("createMessage", () => {
		const systemPrompt = "You are a helpful assistant."
		const messages: Anthropic.Messages.MessageParam[] = [
			{
				role: "user",
				content: [
					{
						type: "text" as const,
						text: "Hello!",
					},
				],
			},
		]

		beforeEach(() => {
			mockFetch.mockImplementation(() =>
				Promise.resolve({
					ok: true,
					body: mockReadableStream([
						{
							choices: [{ delta: { content: "Test response" } }],
							usage: null,
						},
						{
							choices: [{ delta: {} }],
							usage: {
								prompt_tokens: 10,
								completion_tokens: 5,
								cache_creation_input_tokens: 8,
								cache_read_input_tokens: 2,
							},
						},
					]),
					headers: new Headers({ "Content-Type": "text/event-stream" }),
				}),
			)
		})

		it("should handle streaming responses", async () => {
			const stream = handler.createMessage(systemPrompt, messages)
			const chunks: any[] = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}

			expect(chunks.length).toBeGreaterThan(0)
			const textChunks = chunks.filter((chunk) => chunk.type === "text")
			expect(textChunks).toHaveLength(1)
			expect(textChunks[0].text).toBe("Test response")

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.deepseek.com/v1/chat/completions",
				expect.objectContaining({
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer test-api-key",
					},
					body: expect.stringContaining('"stream":true'),
				}),
			)
		})

		it("should include usage information with cache tokens", async () => {
			const stream = handler.createMessage(systemPrompt, messages)
			const chunks: any[] = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}

			const usageChunks = chunks.filter((chunk) => chunk.type === "usage")
			expect(usageChunks.length).toBeGreaterThan(0)
			expect(usageChunks[0].inputTokens).toBe(10)
			expect(usageChunks[0].outputTokens).toBe(5)
			expect(usageChunks[0].cacheWriteTokens).toBe(8)
			expect(usageChunks[0].cacheReadTokens).toBe(2)
		})

		it("should handle reasoner model format", async () => {
			const reasonerHandler = new DeepSeekHandler({
				...mockOptions,
				apiModelId: "deepseek-reasoner",
			})
			const stream = reasonerHandler.createMessage(systemPrompt, messages)
			for await (const _ of stream) {
				// consume stream
			}

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: expect.stringContaining("deepseek-reasoner"),
				}),
			)
		})

		it("should handle API errors", async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: false,
					statusText: "Bad Request",
				}),
			)

			await expect(async () => {
				const stream = handler.createMessage(systemPrompt, messages)
				for await (const _ of stream) {
					// consume stream
				}
			}).rejects.toThrow("DeepSeek API error: Bad Request")
		})
	})

	describe("completePrompt", () => {
		it("should handle non-streaming completion", async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							choices: [{ message: { content: "Test completion" } }],
						}),
				}),
			)

			const result = await handler.completePrompt("Test prompt")
			expect(result).toBe("Test completion")
		})

		it("should handle API errors in completion", async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: false,
					statusText: "Bad Request",
				}),
			)

			await expect(handler.completePrompt("Test prompt")).rejects.toThrow("DeepSeek API error: Bad Request")
		})
	})
})
