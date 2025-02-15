import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useState } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { PEARAI_URL } from "../../../../src/shared/api"
import { validateApiConfiguration } from "@/utils/validate"
import ApiOptions from "../settings/ApiOptions"

const WelcomeView = () => {
	const { apiConfiguration } = useExtensionState()

	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

	const handleSubmit = async () => {
		// Focus the active element's parent to trigger blur
		document.activeElement?.parentElement?.focus()

		// Small delay to let blur events complete
		await new Promise((resolve) => setTimeout(resolve, 50))

		const error = validateApiConfiguration(apiConfiguration)
		if (error) {
			setErrorMessage(error)
			return
		}
		setErrorMessage(undefined)
		vscode.postMessage({
			type: "apiConfiguration",
			apiConfiguration: {
				apiProvider: "pearai",
				pearaiBaseUrl: `${PEARAI_URL}/integrations/cline`,
			},
		})
		// vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
	}

	return (
		<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, padding: "0 20px" }}>
			<h2>Welcome to PearAI Coding Agent (Powered by Roo Code / Cline)!</h2>
			<p>
				Ask me to create a new feature, fix a bug, anything else. I can create & edit files, explore complex
				projects, use the browser, and execute terminal commands!
			</p>

			<div className="mt-3">
				<ApiOptions fromWelcomeView />
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
