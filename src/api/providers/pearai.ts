import { OpenAiHandler } from "./openai"
import { ApiHandlerOptions } from "../../shared/api"

export class PearAiHandler extends OpenAiHandler {
	constructor(options: ApiHandlerOptions) {
		if (!options.pearaiApiKey) {
			throw new Error("PearAI API key is required. Please provide it in the settings.")
		}
		super({
			...options,
			// Map PearAI specific options to OpenAI options for compatibility
			openAiApiKey: options.pearaiApiKey,
			openAiBaseUrl:
				options.pearaiBaseUrl ??
				"https://stingray-app-gb2an.ondigitalocean.app/pearai-server-api2/integrations/cline",
			openAiStreamingEnabled: true,
		})
	}
}
