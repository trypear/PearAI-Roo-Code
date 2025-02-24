import { OpenAiHandler } from "./openai"
import * as vscode from "vscode"
import { ApiHandlerOptions, PEARAI_URL } from "../../shared/api"
import { AnthropicHandler } from "./anthropic"

export class PearAiHandler extends AnthropicHandler {
	constructor(options: ApiHandlerOptions) {
		if (options.pearaiModelInfo) {
			options.pearaiModelInfo = {
				...options.pearaiModelInfo,
				inputPrice: options.pearaiModelInfo.inputPrice ? options.pearaiModelInfo.inputPrice * 1.03 : 0,
				outputPrice: options.pearaiModelInfo.outputPrice ? options.pearaiModelInfo.outputPrice * 1.03 : 0,
			}
		}

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
}
