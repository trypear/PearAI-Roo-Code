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

export interface PearAIAgentModelsConfig {
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
	private pearAIAgentModels: PearAIAgentModelsConfig | null = null
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

		if (modelId.startsWith("pearai")) {
			try {
				if (!options.pearaiAgentModels) {
					console.log("NOT AMAZING")
					throw new Error("PearAI models not found")
				} else {
					console.log("AMAZING")
				}
				const pearaiAgentModels = options.pearaiAgentModels
				const underlyingModel =
					pearaiAgentModels.models[modelId]?.underlyingModelUpdated?.underlyingModel ||
					pearaiAgentModels.models[modelId]?.underlyingModel ||
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

	public getModel(): { id: string; info: ModelInfo } {
		// Fallback to using what's available on client side
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
