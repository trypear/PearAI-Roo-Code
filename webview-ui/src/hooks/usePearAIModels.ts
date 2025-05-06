import { useState, useEffect } from "react"
import { ModelInfo } from "../../../src/shared/api"
import { pearaiDefaultModelId, pearaiDefaultModelInfo, PEARAI_URL } from "../../../src/shared/pearaiApi"
import type { ApiConfiguration } from "../../../src/shared/api"

export const usePearAIModels = (apiConfiguration?: ApiConfiguration) => {
	const [pearaiModels, setPearAIModels] = useState<Record<string, ModelInfo>>({
		[pearaiDefaultModelId]: pearaiDefaultModelInfo,
	})

	useEffect(() => {
		const fetchPearAIModels = async () => {
			try {
				const res = await fetch(`${PEARAI_URL}/getPearAIAgentModels`)
				if (!res.ok) throw new Error("Failed to fetch models")
				const config = await res.json()

				if (config.models && Object.keys(config.models).length > 0) {
					console.log("Models successfully loaded from server")
					setPearAIModels(config.models)
				}
			} catch (error) {
				console.error("Error fetching PearAI models:", error)
			}
		}

		if (apiConfiguration?.apiProvider === "pearai") {
			fetchPearAIModels()
		}
	}, [apiConfiguration?.apiProvider])

	return {
		models: pearaiModels,
	}
}
