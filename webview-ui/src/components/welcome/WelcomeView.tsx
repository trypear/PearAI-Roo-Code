import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { vscode } from "../../utils/vscode"
import { PEARAI_URL } from "../../../../src/shared/api"

const WelcomeView = () => {
	const handleSubmit = () => {
		vscode.postMessage({
			type: "apiConfiguration",
			apiConfiguration: {
				apiProvider: "pearai",
				pearaiBaseUrl: `${PEARAI_URL}/integrations/cline`,
			},
		})
	}

	return (
		<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, padding: "0 20px" }}>
			<h2>Welcome to PearAI's Coding Agent (Powered by Roo Code / Cline)!</h2>
			<p>Ask me to code new features or fix bugs!</p>

			<div style={{ marginTop: "10px" }}>
				<VSCodeButton onClick={handleSubmit} style={{ marginTop: "3px" }}>
					Proceed
				</VSCodeButton>
			</div>
		</div>
	)
}

export default WelcomeView
