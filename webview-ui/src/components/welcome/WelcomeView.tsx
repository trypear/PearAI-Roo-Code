import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useCallback, useState } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { PEARAI_URL } from "../../../../src/shared/api"
import { validateApiConfiguration } from "@/utils/validate"
import ApiOptions from "../settings/ApiOptions"

const WelcomeView = () => {
	const { apiConfiguration, currentApiConfigName, setApiConfiguration, uriScheme } = useExtensionState()

	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

	const handleSubmit = useCallback(() => {
		const error = validateApiConfiguration(apiConfiguration)

		if (error) {
			setErrorMessage(error)
			return
		}

		setErrorMessage(undefined)
		vscode.postMessage({
			type: "upsertApiConfiguration",
			text: currentApiConfigName,
			apiConfiguration: {
				apiProvider: "pearai",
				pearaiBaseUrl: `${PEARAI_URL}/integrations/cline`,
			},
		})
		// vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
		// vscode.postMessage({ type: "upsertApiConfiguration", text: currentApiConfigName, apiConfiguration })
	}, [apiConfiguration, currentApiConfigName])

	return (
		<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, padding: "0 20px" }}>
			<h2>Welcome to PearAI Coding Agent (Powered by Roo Code / Cline)!</h2>
			<p>
				Ask me to create a new feature, fix a bug, anything else. I can create & edit files, explore complex
				projects, use the browser, and execute terminal commands!
			</p>

			<div className="mt-3">
				<ApiOptions
					fromWelcomeView
					apiConfiguration={apiConfiguration || {}}
					uriScheme={uriScheme}
					setApiConfigurationField={(field, value) => setApiConfiguration({ [field]: value })}
					errorMessage={errorMessage}
					setErrorMessage={setErrorMessage}
				/>
			</div>

			<div style={{ marginTop: "10px" }}>
				<VSCodeButton onClick={handleSubmit} style={{ marginTop: "3px" }}>
					Next
				</VSCodeButton>
				{errorMessage && <span className="text-destructive">{errorMessage}</span>}
			</div>
		</div>
	)
}

export default WelcomeView
