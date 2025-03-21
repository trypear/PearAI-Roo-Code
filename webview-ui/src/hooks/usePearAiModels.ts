import { useState, useEffect } from "react"
import { ModelInfo, pearAiDefaultModelId, pearAiDefaultModelInfo, PEARAI_URL } from "../../../src/shared/api"
import type { ApiConfiguration } from "../../../src/shared/api"

export const usePearAiModels = (apiConfiguration?: ApiConfiguration) => {
	const [pearAiModels, setPearAiModels] = useState<Record<string, ModelInfo>>({
		[pearAiDefaultModelId]: pearAiDefaultModelInfo,
	})

	useEffect(() => {
		const fetchPearAiModels = async () => {
			try {
				const res = await fetch(`${PEARAI_URL}/getPearAIAgentModels`)
				if (!res.ok) throw new Error("Failed to fetch models")
				const config = await res.json()

				if (config.models && Object.keys(config.models).length > 0) {
					console.log("Models successfully loaded from server")
					setPearAiModels(config.models)
				}
			} catch (error) {
				console.error("Error fetching PearAI models:", error)
			}
		}

		if (apiConfiguration?.apiProvider === "pearai") {
			fetchPearAiModels()
		}
	}, [apiConfiguration?.apiProvider])

	return pearAiModels
}
