import { OpenAiHandler } from "./openai"
import { ApiHandlerOptions, PEARAI_URL } from "../../shared/api"

export class PearAiHandler extends OpenAiHandler {
	constructor(options: ApiHandlerOptions) {
		if (!options.pearaiApiKey) {
			throw new Error("PearAI API key not found. Please login to PearAI.")
		}
		super({
			...options,
			// Map PearAI specific options to OpenAI options for compatibility
			openAiApiKey: options.pearaiApiKey,
			openAiBaseUrl: PEARAI_URL,
			openAiStreamingEnabled: true,
		})
	}
}
