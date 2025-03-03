import * as vscode from "vscode"
import { ApiHandlerOptions, PEARAI_URL, ModelInfo } from "../../shared/api"
import { AnthropicHandler } from "./anthropic"
import { DeepSeekHandler } from "./deepseek"

export class PearAiHandler {
	private handler: AnthropicHandler | DeepSeekHandler

	constructor(options: ApiHandlerOptions) {
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
		}

		// Determine which handler to use based on model
		const modelId = options.apiModelId || ""
		if (modelId.startsWith("claude")) {
			this.handler = new AnthropicHandler({
				...options,
				apiKey: options.pearaiApiKey,
				anthropicBaseUrl: PEARAI_URL,
			})
		} else if (modelId.startsWith("deepseek")) {
			this.handler = new DeepSeekHandler({
				...options,
				deepSeekApiKey: options.pearaiApiKey,
				deepSeekBaseUrl: PEARAI_URL,
			})
		} else {
			throw new Error(`Unsupported model: ${modelId}`)
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		const baseModel = this.handler.getModel()
		return {
			id: baseModel.id,
			info: {
				...baseModel.info,
				inputPrice: (baseModel.info.inputPrice || 0) * 1.03,
				outputPrice: (baseModel.info.outputPrice || 0) * 1.03,
				cacheWritesPrice: baseModel.info.cacheWritesPrice ? baseModel.info.cacheWritesPrice * 1.03 : undefined,
				cacheReadsPrice: baseModel.info.cacheReadsPrice ? baseModel.info.cacheReadsPrice * 1.03 : undefined,
			},
		}
	}

	// Proxy all handler methods
	async *createMessage(systemPrompt: string, messages: any[]): AsyncGenerator<any> {
		return this.handler.createMessage(systemPrompt, messages)
	}

	async completePrompt(prompt: string): Promise<string> {
		return this.handler.completePrompt(prompt)
	}
}
