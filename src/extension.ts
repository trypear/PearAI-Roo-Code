import * as vscode from "vscode"
import * as dotenvx from "@dotenvx/dotenvx"
import delay from "delay"
import * as path from "path"

// Load environment variables from .env file
try {
	// Specify path to .env file in the project root directory
	const envPath = path.join(__dirname, "..", ".env")
	dotenvx.config({ path: envPath })
} catch (e) {
	// Silently handle environment loading errors
	console.warn("Failed to load environment variables:", e)
}

import "./utils/path" // Necessary to have access to String.prototype.toPosix.

import { ContextProxy } from "./core/config/ContextProxy"
import { ClineProvider } from "./core/webview/ClineProvider"
import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"
import { TerminalRegistry } from "./integrations/terminal/TerminalRegistry"
import { McpServerManager } from "./services/mcp/McpServerManager"
import { telemetryService } from "./services/telemetry/TelemetryService"
import { API } from "./exports/api"
import { migrateSettings } from "./utils/migrateSettings"
import { formatLanguage } from "./shared/language"

import {
	handleUri,
	registerCommands,
	registerCodeActions,
	registerTerminalActions,
	CodeActionProvider,
	registerPearListener,
} from "./activate"
import { initializeI18n } from "./i18n"

/**
 * Built using https://github.com/microsoft/vscode-webview-ui-toolkit
 *
 * Inspired by:
 *  - https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/weather-webview
 *  - https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-cra
 */

let outputChannel: vscode.OutputChannel
let extensionContext: vscode.ExtensionContext

// This method is called when your extension is activated.
// Your extension is activated the very first time the command is executed.
export async function activate(context: vscode.ExtensionContext) {
	extensionContext = context
	outputChannel = vscode.window.createOutputChannel("Roo-Code")
	context.subscriptions.push(outputChannel)
	outputChannel.appendLine("Roo-Code extension activated")

	// Migrate old settings to new
	await migrateSettings(context, outputChannel)

	// Initialize telemetry service after environment variables are loaded.
	telemetryService.initialize()

	// Initialize i18n for internationalization support
	initializeI18n(context.globalState.get("language") ?? formatLanguage(vscode.env.language))

	// Initialize terminal shell execution handlers.
	TerminalRegistry.initialize()

	// Get default commands from configuration.
	const defaultCommands = vscode.workspace.getConfiguration("roo-cline").get<string[]>("allowedCommands") || []

	// Initialize global state if not already set.
	if (!context.globalState.get("allowedCommands")) {
		context.globalState.update("allowedCommands", defaultCommands)
	}

	const contextProxy = await ContextProxy.getInstance(context)
	const provider = new ClineProvider(context, outputChannel, "sidebar", contextProxy)
	telemetryService.setProvider(provider)

	registerPearListener(provider);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ClineProvider.sideBarId, provider, {
			webviewOptions: { retainContextWhenHidden: true },
		}),
	)

	registerCommands({ context, outputChannel, provider })

	/**
	 * We use the text document content provider API to show the left side for diff
	 * view by creating a virtual document for the original content. This makes it
	 * readonly so users know to edit the right side if they want to keep their changes.
	 *
	 * This API allows you to create readonly documents in VSCode from arbitrary
	 * sources, and works by claiming an uri-scheme for which your provider then
	 * returns text contents. The scheme must be provided when registering a
	 * provider and cannot change afterwards.
	 *
	 * Note how the provider doesn't create uris for virtual documents - its role
	 * is to provide contents given such an uri. In return, content providers are
	 * wired into the open document logic so that providers are always considered.
	 *
	 * https://code.visualstudio.com/api/extension-guides/virtual-documents
	 */

	context.subscriptions.push(
		vscode.commands.registerCommand("pearai-roo-cline.pearaiLogin", async (data) => {
			console.dir("Logged in to PearAI:")
			console.dir(data)
			context.secrets.store("pearaiApiKey", data.accessToken)
			context.secrets.store("pearaiRefreshKey", data.refreshToken)
			const provider = await ClineProvider.getInstance()
			if (provider) {
				// Update the API configuration to clear the PearAI key
				await provider.setValues({
					pearaiApiKey: data.accessToken,
				})
				await provider.postStateToWebview()
				// Update MCP server with new token
				const mcpHub = provider.getMcpHub()
				if (mcpHub) {
					await mcpHub.updatePearAIApiKey(data.accessToken)
				}
			}
			vscode.commands.executeCommand("roo-cline.plusButtonClicked")
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("pearai-roo-cline.updatePearAITokens", async (data) => {
			console.dir("Updated PearAI tokens:")
			console.dir(data)
			context.secrets.store("pearaiApiKey", data.accessToken)
			context.secrets.store("pearaiRefreshKey", data.refreshToken)
			const provider = await ClineProvider.getInstance()
			if (provider) {
				// Update the API configuration to clear the PearAI key
				await provider.setValues({
					pearaiApiKey: data.accessToken,
				})
				await provider.postStateToWebview()
				// Update MCP server with new token
				const mcpHub = provider.getMcpHub()
				if (mcpHub) {
					await mcpHub.updatePearAIApiKey(data.accessToken)
				}
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("pearai-roo-cline.pearaiLogout", async () => {
			console.dir("Logged out of PearAI:")
			context.secrets.delete("pearaiApiKey")
			context.secrets.delete("pearaiRefreshKey")

			// Get the current provider instance and update webview state
			const provider = await ClineProvider.getInstance()
			if (provider) {
				// Update the API configuration to clear the PearAI key
				await provider.setValues({
					pearaiApiKey: undefined,
				})
				await provider.postStateToWebview()
				// Clear MCP server token
				const mcpHub = provider.getMcpHub()
				if (mcpHub) {
					await mcpHub.clearPearAIApiKey()
				}
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("pearai-roo-cline.PearAIKeysNotFound", async () => {
			const provider = await ClineProvider.getInstance()
			if (provider) {
				provider.postMessageToWebview({ type: "action", action: "PearAIKeysNotFound" })
			}
		}),
	)

	/*
	We use the text document content provider API to show the left side for diff view by creating a virtual document for the original content. This makes it readonly so users know to edit the right side if they want to keep their changes.

	- This API allows you to create readonly documents in VSCode from arbitrary sources, and works by claiming an uri-scheme for which your provider then returns text contents. The scheme must be provided when registering a provider and cannot change afterwards.
	- Note how the provider doesn't create uris for virtual documents - its role is to provide contents given such an uri. In return, content providers are wired into the open document logic so that providers are always considered.
	https://code.visualstudio.com/api/extension-guides/virtual-documents
	*/
	const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return Buffer.from(uri.query, "base64").toString("utf-8")
		}
	})()

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider),
	)

	context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }))

	// Register code actions provider.
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider({ pattern: "**/*" }, new CodeActionProvider(), {
			providedCodeActionKinds: CodeActionProvider.providedCodeActionKinds,
		}),
	)

	registerCodeActions(context)
	registerTerminalActions(context)

	context.subscriptions.push(
		vscode.commands.registerCommand("roo-cline.focus", async (...args: any[]) => {
			await vscode.commands.executeCommand("pearai-roo-cline.SidebarProvider.focus")
		}),
	)
	// Allows other extensions to activate once Roo is ready.
	vscode.commands.executeCommand("roo-cline.activationCompleted")

	// Implements the `RooCodeAPI` interface.
	const socketPath = process.env.ROO_CODE_IPC_SOCKET_PATH
	const enableLogging = typeof socketPath === "string"
	return new API(outputChannel, provider, socketPath, enableLogging)
}

// This method is called when your extension is deactivated
export async function deactivate() {
	outputChannel.appendLine("Roo-Code extension deactivated")
	// Clean up MCP server manager
	await McpServerManager.cleanup(extensionContext)
	telemetryService.shutdown()

	// Clean up terminal handlers
	TerminalRegistry.cleanup()
}
