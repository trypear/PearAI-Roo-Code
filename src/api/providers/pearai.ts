import { OpenAiHandler } from "./openai"
import { ApiHandlerOptions, PEARAI_URL } from "../../shared/api"
import { AnthropicHandler } from "./anthropic"

export class PearAiHandler extends AnthropicHandler {
	constructor(options: ApiHandlerOptions) {
		if (!options.pearaiApiKey) {
			throw new Error("PearAI API key not found. Please login to PearAI.")
		}
		super({
			...options,
			apiKey: options.pearaiApiKey,
			anthropicBaseUrl: PEARAI_URL,
		})
	}
}
