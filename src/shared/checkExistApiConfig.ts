import { ApiConfiguration } from "../shared/api"
import { SECRET_KEYS } from "./globalState"

export function checkExistKey(config: ApiConfiguration | undefined) {
	if (!config) return false

	// Special case for providers that don't need configuration in the apiConfiguration object
	if (config.apiProvider === "human-relay" || config.apiProvider === "fake-ai" || config.apiProvider === "pearai") {
		return true
	}

	// Check all secret keys from the centralized SECRET_KEYS array
	const hasSecretKey = SECRET_KEYS.some((key) => config[key as keyof ApiConfiguration] !== undefined)

	// Check additional non-secret configuration properties
	const hasOtherConfig = [
		config.awsRegion,
		config.vertexProjectId,
		config.ollamaModelId,
		config.lmStudioModelId,
		config.vsCodeLmModelSelector,
	].some((value) => value !== undefined)

	return hasSecretKey || hasOtherConfig
}
