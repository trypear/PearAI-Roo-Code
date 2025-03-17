import { RouterProvider, createMemoryRouter } from "react-router-dom"
import App from "./App"
import { CreatorOverlay } from "./creatorOverlay"
import { useEffect } from "react"

const router = createMemoryRouter([
	{
		path: "/",
		children: [
			{
				path: "/",
				element:
					window.viewType === "pearai.roo.agentChat" ? (
						<App />
					) : window.viewType === "pearai.roo.creatorOverlayView" ? (
						<CreatorOverlay />
					) : (
						<App />
					), // Falling back to the agent chat incase something fails
			},
		],
	},
])

function Router() {
	return <RouterProvider router={router} />
}

export default Router
