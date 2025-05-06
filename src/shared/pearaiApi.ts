// CHANGE AS NEEDED FOR DEVELOPMENT
// PROD:
export const PEARAI_URL = "https://server.trypear.ai/pearai-server-api2/integrations/cline"
// DEV:
// export const PEARAI_URL = "http://localhost:8000/integrations/cline"

import {
	anthropicModels,
	bedrockModels,
	deepSeekModels,
	geminiModels,
	glamaDefaultModelId,
	glamaDefaultModelInfo,
	mistralModels,
	ModelInfo,
	openAiNativeModels,
	openRouterDefaultModelId,
	openRouterDefaultModelInfo,
	requestyDefaultModelId,
	requestyDefaultModelInfo,
	unboundDefaultModelId,
	unboundDefaultModelInfo,
	vertexModels,
} from "./api"

// PearAI
export type PearAIModelId = keyof typeof pearaiModels
export const pearaiDefaultModelId: PearAIModelId = "pearai-model"
export const pearaiDefaultModelInfo: ModelInfo = {
	maxTokens: 8192,
	contextWindow: 200_000,
	supportsImages: true,
	supportsPromptCache: true,
	inputPrice: 3.0,
	outputPrice: 15.0,
	cacheWritesPrice: 3.75,
	cacheReadsPrice: 0.3,
	description:
		"PearAI Model automatically routes you to the most best / most suitable model on the market. Recommended for most users.",
}

export const pearaiModels = {
	"pearai-model": {
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 3.0,
		outputPrice: 15.0,
		cacheWritesPrice: 3.75,
		cacheReadsPrice: 0.3,
		description:
			"PearAI Model automatically routes you to the most best / most suitable model on the market. Recommended for most users.",
	},
} as const satisfies Record<string, ModelInfo>

export const allModels: { [key: string]: ModelInfo } = {
	// Anthropic models
	...Object.entries(anthropicModels).reduce(
		(acc, [key, value]) => ({
			...acc,
			[`anthropic/${key}`]: value,
		}),
		{},
	),

	// Bedrock models
	...Object.entries(bedrockModels).reduce(
		(acc, [key, value]) => ({
			...acc,
			[`bedrock/${key}`]: value,
		}),
		{},
	),

	// Glama models (single default model)
	[`glama/${glamaDefaultModelId}`]: glamaDefaultModelInfo,

	// Requesty models (single default model)
	[`requesty/${requestyDefaultModelId}`]: requestyDefaultModelInfo,

	// OpenRouter models (single default model)
	[`openrouter/${openRouterDefaultModelId}`]: openRouterDefaultModelInfo,

	// Vertex models
	...Object.entries(vertexModels).reduce(
		(acc, [key, value]) => ({
			...acc,
			[`vertex_ai/${key}`]: value,
		}),
		{},
	),

	// Gemini models
	...Object.entries(geminiModels).reduce(
		(acc, [key, value]) => ({
			...acc,
			[`gemini/${key}`]: value,
		}),
		{},
	),

	// OpenAI Native models
	...Object.entries(openAiNativeModels).reduce(
		(acc, [key, value]) => ({
			...acc,
			[`openai-native/${key}`]: value,
		}),
		{},
	),

	// DeepSeek models
	...Object.entries(deepSeekModels).reduce(
		(acc, [key, value]) => ({
			...acc,
			[`deepseek/${key}`]: value,
		}),
		{},
	),

	// Mistral models
	...Object.entries(mistralModels).reduce(
		(acc, [key, value]) => ({
			...acc,
			[`mistral/${key}`]: value,
		}),
		{},
	),

	// Unbound models (single default model)
	[`unbound/${unboundDefaultModelId}`]: unboundDefaultModelInfo,
} as const satisfies Record<string, ModelInfo>

export interface creatorModeConfig {
	creatorMode?: boolean // Defaults to false when not set
	newProjectType?: string
	newProjectPath?: string
}
