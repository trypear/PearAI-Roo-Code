import * as vscode from "vscode"
import { ClineProvider } from "../core/webview/ClineProvider"
import { assert } from "../utils/util"
import { CreatorModeConfig } from "../schemas"


export const getPearaiExtension = async () => {
	const pearAiExtension = vscode.extensions.getExtension("pearai.pearai")

	assert(!!pearAiExtension, "PearAI extension not found")

	if (!pearAiExtension.isActive) {
		await pearAiExtension.activate()
	}

	return pearAiExtension
}

export const registerPearListener = async () => {
	// Getting the pear ai extension instance
	const pearAiExtension = await getPearaiExtension()

	// Access the API directly from exports
	if (pearAiExtension.exports) {
		pearAiExtension.exports.pearAPI.creatorMode.onDidRequestExecutePlan(async (msg: any) => {
			console.dir(`onDidRequestNewTask triggered with: ${JSON.stringify(msg)}`)
			// Get the sidebar provider
			let sidebarProvider = ClineProvider.getVisibleInstance()

			// TODO: LOOK INTO THIS - THIS IS A JANKY FIX AND IT FEELS LIKE THIS IS TEMPERAMENTAL
			while (!sidebarProvider) {
				await new Promise((resolve) => setTimeout(resolve, 500))
				sidebarProvider = ClineProvider.getVisibleInstance()
			}

			// Focus the sidebar first
			await vscode.commands.executeCommand("pearai-roo-cline.SidebarProvider.focus")

			// Wait for the view to be ready using a helper function
			await ensureViewIsReady(sidebarProvider)

			if (msg.creatorModeConfig?.creatorMode) {
				// Switch to creator mode
				await sidebarProvider.handleModeSwitch("creator")
				await sidebarProvider.postStateToWebview()
			}
			// Navigate to chat view
			await sidebarProvider.postMessageToWebview({ type: "action", action: "chatButtonClicked" })

			// Wait a brief moment for UI to update
			await new Promise((resolve) => setTimeout(resolve, 300))

			let creatorModeConfig = {
				creatorMode: true,
				newProjectType: msg.newProjectType,
				newProjectPath: msg.newProjectPath,
			}

			console.log('Called init with taskk', msg.plan, undefined, undefined, undefined, creatorModeConfig);

			// Initialize with task
			await sidebarProvider.initClineWithTask(msg.plan, undefined, undefined, undefined, creatorModeConfig);
		});
		// If there's a creator event in the cache after the extensions were refreshed, we need to get it!
		pearAiExtension.exports.pearAPI.creatorMode.triggerCachedCreatorEvent(true);
		console.log("triggerCachedCreatorEvent CALLED!")
	} else {
		console.error("⚠️⚠️ PearAI API not available in exports ⚠️⚠️")
	}
}

// TODO: decide if this is needed
// Helper function to ensure the webview is ready
async function ensureViewIsReady(provider: ClineProvider): Promise<void> {
	// If the view is already launched, we're good to go
	if (provider.viewLaunched) {
		return
	}

	// Otherwise, we need to wait for it to initialize
	return new Promise<void>((resolve) => {
		// Set up a one-time listener for when the view is ready
		const disposable = provider.on("clineCreated", () => {
			// Clean up the listener
			disposable.dispose()
			resolve()
		})

		// Set a timeout just in case
		setTimeout(() => {
			disposable.dispose()
			resolve()
		}, 5000)
	})
}
