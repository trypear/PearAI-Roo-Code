import * as vscode from "vscode"
import { ApiHandlerOptions, ModelInfo } from "../../../shared/api"
import { AnthropicHandler } from "../anthropic"
import { DeepSeekHandler } from "../deepseek"
import Anthropic from "@anthropic-ai/sdk"
import { BaseProvider } from "../base-provider"
import { SingleCompletionHandler } from "../.."
import { OpenRouterHandler } from "../openrouter"
import { GeminiHandler } from "../gemini"
import { OpenAiHandler } from "../openai"
import { PearAIGenericHandler } from "./pearaiGeneric"
import { PEARAI_URL } from "../../../shared/pearaiApi"

interface PearAiModelsResponse {
	models: {
		[key: string]: {
			underlyingModel?: { [key: string]: any }
			[key: string]: any
		}
	}
	defaultModelId: string
}

export class PearAiHandler extends BaseProvider implements SingleCompletionHandler {
	private handler!: AnthropicHandler | PearAIGenericHandler
	private pearAiModelsResponse: PearAiModelsResponse | null = null
	private options: ApiHandlerOptions
	private initializationPromise: Promise<void> | null = null

	// Private constructor - use the static create method instead
	private constructor(options: ApiHandlerOptions) {
		super()
		if (!options.pearaiApiKey) {
			vscode.window.showErrorMessage("PearAI API key not found.", "Login to PearAI").then(async (selection) => {
				if (selection === "Login to PearAI") {
					const extensionUrl = `${vscode.env.uriScheme}://pearai.pearai/auth`
					const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(extensionUrl))
					vscode.env.openExternal(
						await vscode.env.asExternalUri(
							vscode.Uri.parse(`https://trypear.ai/signin?callback=${callbackUri.toString()}`),
						),
					)
				}
			})
			throw new Error("PearAI API key not found. Please login to PearAI.")
		} else {
			vscode.commands.executeCommand("pearai.checkPearAITokens", undefined)
		}
		this.options = options
		// Start initialization immediately
		this.initializationPromise = this.initializeHandler(options)
	}

	// Static factory method that properly awaits initialization
	public static async create(options: ApiHandlerOptions): Promise<PearAiHandler> {
		const instance = new PearAiHandler(options)
		// Wait for initialization to complete
		await instance.initializationPromise
		return instance
	}

	private async initializeHandler(options: ApiHandlerOptions): Promise<void> {
		const modelId = options.apiModelId || "pearai-model"

		if (modelId.startsWith("pearai")) {
			try {
				const response = await fetch(`${PEARAI_URL}/getPearAIAgentModels`)
				if (!response.ok) {
					throw new Error(`Failed to fetch models: ${response.statusText}`)
				}
				const data = (await response.json()) as PearAiModelsResponse
				this.pearAiModelsResponse = data
				const underlyingModel =
					data.models[modelId]?.underlyingModelUpdated?.underlyingModel ||
					data.models[modelId]?.underlyingModel ||
					"claude-3-5-sonnet-20241022"
				if (underlyingModel.startsWith("claude") || modelId.startsWith("anthropic/")) {
					// Default to Claude
					this.handler = new AnthropicHandler({
						...options,
						apiKey: options.pearaiApiKey,
						anthropicBaseUrl: PEARAI_URL,
						apiModelId: underlyingModel,
					})
				} else {
					this.handler = new PearAIGenericHandler({
						...options,
						openAiBaseUrl: PEARAI_URL,
						openAiApiKey: options.pearaiApiKey,
						openAiModelId: underlyingModel,
					})
				}
			} catch (error) {
				console.error("Error fetching PearAI models:", error)
				// Default to Claude if there's an error
				this.handler = new AnthropicHandler({
					...options,
					apiKey: options.pearaiApiKey,
					anthropicBaseUrl: PEARAI_URL,
					apiModelId: "claude-3-5-sonnet-20241022",
				})
			}
		} else if (modelId.startsWith("claude") || modelId.startsWith("anthropic/")) {
			this.handler = new AnthropicHandler({
				...options,
				apiKey: options.pearaiApiKey,
				anthropicBaseUrl: PEARAI_URL,
			})
		} else {
			this.handler = new PearAIGenericHandler({
				...options,
				openAiBaseUrl: PEARAI_URL,
				openAiApiKey: options.pearaiApiKey,
				openAiModelId: modelId,
			})
		}
	}

	private async ensureInitialized(): Promise<void> {
		if (this.initializationPromise) {
			await this.initializationPromise
		}
	}

	async getModel(): Promise<{ id: string; info: ModelInfo }> {
		await this.ensureInitialized()
		
		if (this.options.apiModelId) {
			let modelInfo = null
			if (this.options.apiModelId.startsWith("pearai")) {
				modelInfo = this.pearAiModelsResponse?.models[this.options.apiModelId].underlyingModelUpdated
			} else if (this.pearAiModelsResponse) {
				modelInfo = this.pearAiModelsResponse.models[this.options.apiModelId || "pearai-model"]
			}
			if (modelInfo) {
				return {
					id: this.options.apiModelId,
					info: {
						contextWindow: modelInfo.contextWindow || 4096, // provide default or actual value
						supportsPromptCache: modelInfo.supportsPromptCaching || false, // provide default or actual value
						...modelInfo,
					},
				}
			}
		}

		// Fallback to using what's available on client side
		const baseModel = this.handler.getModel()
		return baseModel
	}

	async *createMessage(systemPrompt: string, messages: any[]): AsyncGenerator<any> {
		await this.ensureInitialized()
		const generator = this.handler.createMessage(systemPrompt, messages)
		let warningMsg = ""

		for await (const chunk of generator) {
			console.dir(chunk)
			if (chunk.type === "text" && chunk.metadata?.ui_only) {
				warningMsg += chunk.metadata?.content
				continue
			}
			yield chunk
		}

		if (warningMsg) {
			if (warningMsg.includes("pay-as-you-go")) {
				vscode.window.showInformationMessage(warningMsg, "View Pay-As-You-Go").then((selection) => {
					if (selection === "View Pay-As-You-Go") {
						vscode.env.openExternal(vscode.Uri.parse("https://trypear.ai/pay-as-you-go"))
					}
				})
			} else {
				vscode.window.showInformationMessage(warningMsg)
			}
		}
	}

	async completePrompt(prompt: string): Promise<string> {
		await this.ensureInitialized()
		return this.handler.completePrompt(prompt)
	}
}
