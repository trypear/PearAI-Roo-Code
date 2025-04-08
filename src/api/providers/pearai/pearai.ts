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
			underlyingModel?: string
			[key: string]: any
		}
	}
	defaultModelId: string
}

export class PearAiHandler extends BaseProvider implements SingleCompletionHandler {
	private handler!: AnthropicHandler | PearAIGenericHandler
	private pearAiModelsResponse: PearAiModelsResponse | null = null
	private options: ApiHandlerOptions

	constructor(options: ApiHandlerOptions) {
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

		this.handler = new PearAIGenericHandler({
			...options,
			openAiBaseUrl: PEARAI_URL,
			openAiApiKey: options.pearaiApiKey,
			openAiModelId: "deepseek/deepseek-chat",
		})

		// Then try to initialize the correct handler asynchronously
		this.initializeHandler(options).catch((error) => {
			console.error("Failed to initialize PearAI handler:", error)
		})
	}

	private async initializeHandler(options: ApiHandlerOptions): Promise<void> {
		const modelId = options.apiModelId || "pearai-model"

		if (modelId === "pearai-model") {
			try {
				const response = await fetch(`${PEARAI_URL}/getPearAIAgentModels`)
				if (!response.ok) {
					throw new Error(`Failed to fetch models: ${response.statusText}`)
				}
				const data = (await response.json()) as PearAiModelsResponse
				this.pearAiModelsResponse = data
				const underlyingModel = data.models[modelId]?.underlyingModelUpdated || "claude-3-5-sonnet-20241022"
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

	getModel(): { id: string; info: ModelInfo } {
		if (
			this.pearAiModelsResponse &&
			this.options.apiModelId === "pearai-model" &&
			this.pearAiModelsResponse.models
		) {
			const modelInfo = this.pearAiModelsResponse.models[this.options.apiModelId]
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
		const baseModel = this.handler.getModel()
		return baseModel
	}

	async *createMessage(systemPrompt: string, messages: any[]): AsyncGenerator<any> {
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
		return this.handler.completePrompt(prompt)
	}
}
