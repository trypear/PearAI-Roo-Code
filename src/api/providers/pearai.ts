import { OpenAiHandler } from "./openai"
import * as vscode from "vscode"
import { AnthropicModelId, ApiHandlerOptions, ModelInfo, PEARAI_URL } from "../../shared/api"
import { AnthropicHandler } from "./anthropic"

export class PearAiHandler extends AnthropicHandler {
	constructor(options: ApiHandlerOptions) {
		if (!options.pearaiApiKey) {
			vscode.window.showErrorMessage("PearAI API key not found.", "Login to PearAI").then(async (selection) => {
				if (selection === "Login to PearAI") {
					const extensionUrl = `${vscode.env.uriScheme}://pearai.pearai/auth`
					const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(extensionUrl))

					vscode.env.openExternal(
						await vscode.env.asExternalUri(
							vscode.Uri.parse(
								`https://trypear.ai/signin?callback=${callbackUri.toString()}`, // Change to localhost if running locally
							),
						),
					)
				}
			})
			throw new Error("PearAI API key not found. Please login to PearAI.")
		}
		super({
			...options,
			apiKey: options.pearaiApiKey,
			anthropicBaseUrl: PEARAI_URL,
		})
	}

	override getModel(): { id: AnthropicModelId; info: ModelInfo } {
		const baseModel = super.getModel()
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
}
