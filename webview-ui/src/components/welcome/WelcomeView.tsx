import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useState } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"

const WelcomeView = () => {
	const handleSubmit = () => {
		vscode.postMessage({
			type: "apiConfiguration",
			apiConfiguration: {
				apiProvider: "pearai",
				pearaiApiKey: "temp", // TODO: Change this to use api-key
				pearaiBaseUrl: "http://localhost:8000/integrations/cline",
			},
		})
	}

	return (
		<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, padding: "0 20px" }}>
			<h2>Welcome to PearAI's Coding Agent (Powered by Roo Code / Cline)!</h2>
			<p>
				I can do all kinds of tasks thanks to the latest breakthroughs in agentic coding capabilities and access
				to tools that let me create & edit files, explore complex projects, use the browser, and execute
				terminal commands (with your permission, of course). I can even use MCP to create new tools and extend
				my own capabilities.
			</p>

			<div style={{ marginTop: "10px" }}>
				<VSCodeButton onClick={handleSubmit} style={{ marginTop: "3px" }}>
					Let's go!
				</VSCodeButton>
			</div>
		</div>
	)
}

export default WelcomeView
