import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App"
import "../../node_modules/@vscode/codicons/dist/codicon.css"

declare global {
	interface Window {
		isCreator?: string
	}
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
