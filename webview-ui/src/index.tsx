import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import Router from "./router"
import "../../node_modules/@vscode/codicons/dist/codicon.css"

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Router />
	</StrictMode>,
)
