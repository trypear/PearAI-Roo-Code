import * as vscode from "vscode"
import { ClineProvider } from "../core/webview/ClineProvider"
import { assert } from "../utils/util"
import { PEARAI_CREATOR_MODE_WEBAPP_MANAGER_SLUG } from "../shared/modes"

export const getPearaiExtension = async () => {
	const pearAiExtension = vscode.extensions.getExtension("pearai.pearai")

	assert(!!pearAiExtension, "PearAI extension not found")

	if (!pearAiExtension.isActive) {
		await pearAiExtension.activate()
	}

	return pearAiExtension
}

// TODO: TYPES
export const getpearAIExports = async () => {
	const pearAiExtension = await getPearaiExtension()

	assert(!!pearAiExtension.exports, "⚠️⚠️ Error, no PearAI Exports could be found :( ⚠️⚠️");

	return pearAiExtension.exports;
}
 
// TODO: SHOULD HAVE TYPE SYNCED WITH THE PEARAI SUBMODULE!
type CreatorModeState = "OVERLAY_CLOSED" | "OVERLAY_OPEN" | "OVERLAY_CLOSED_CREATOR_ACTIVE"

export const registerPearListener = async (provider: ClineProvider) => {
	// Getting the pear ai extension instance
	const exports = await getpearAIExports()

	exports.pearAPI.creatorMode.onDidRequestExecutePlan(async (msg: any) => {
		console.dir(`onDidRequestNewTask triggered with: ${JSON.stringify(msg)}`)

		let canContinue = false;

		while(!canContinue) {
			await new Promise((resolve) => setTimeout(resolve, 10));
			canContinue = provider.viewLaunched && provider.isViewLaunched;
		}


		// Get the sidebar provider
		// Focus the sidebar first
		await vscode.commands.executeCommand("pearai-roo-cline.SidebarProvider.focus")

		// Wait for the view to be ready using a helper function
		await ensureViewIsReady(provider)
		// Wait a brief moment for UI to update
		await new Promise((resolve) => setTimeout(resolve, 3000))

		// * This does actually work but the UI update does not happen. This method calls this.postStateToWebview() so not sure what is going on - James
		if(msg.newProjectType !== "NONE") {
			// Only switch to the creator manager if we're creating a new project
			// TODO: later when we need to make a different type of project, we need to change this
			await provider.handleModeSwitch(PEARAI_CREATOR_MODE_WEBAPP_MANAGER_SLUG);
		}

		// Clicl the chat btn
		await provider.postMessageToWebview({ type: "action", action: "chatButtonClicked" })

		const creatorModeConfig = {
			creatorMode: true,
			newProjectType: msg.newProjectType,
			newProjectPath: msg.newProjectPath,
		}


		// Initialize with task
		await provider.initClineWithTask(msg.plan, undefined, undefined, undefined, creatorModeConfig);
	});
	// If there's a creator event in the cache after the extensions were refreshed, we need to get it!
	exports.pearAPI.creatorMode.triggerCachedCreatorEvent(true);

	exports.pearAPI.creatorMode.onDidChangeCreatorModeState(async (state: CreatorModeState) => {
		// Get the sidebar provider
		const sidebarProvider = ClineProvider.getVisibleInstance();
		
		if (sidebarProvider) {
			// Send a message to the webview that will trigger a window event
			sidebarProvider.postMessageToWebview({
				type: "creatorModeUpdate",
				text: state,
			});
		}
	});

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
