/// <reference types="vite/client" />

declare global {
	interface Window {
		viewType?: "pearai.roo.agentChat" | "pearai.roo.creatorOverlayView"
	}
}

export {}
