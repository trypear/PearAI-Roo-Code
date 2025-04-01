import * as vscode from "vscode"
import * as path from "path"
import { ExtensionMessage } from "../../shared/ExtensionMessage"

export async function readWorkspaceFile(
	relativePath: string,
	options: { create?: boolean; ensureDirectory?: boolean; content?: string } = {},
): Promise<ExtensionMessage> {
	try {
		// Get workspace root
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		console.log("Workspace root:", workspaceRoot)

		// If no workspace root, try to use the current working directory
		const effectiveRoot = workspaceRoot || process.cwd()
		console.log("Effective root:", effectiveRoot)

		// Resolve the full path
		const fullPath = path.join(effectiveRoot, relativePath)
		console.log("Full path:", fullPath)
		const uri = vscode.Uri.file(fullPath)
		console.log("URI:", uri.toString())

		// Check if file exists
		try {
			const fileContent = await vscode.workspace.fs.readFile(uri)
			return {
				type: "fileContent",
				content: Buffer.from(fileContent).toString("utf8"),
			}
		} catch {
			// File doesn't exist
			if (!options.create) {
				throw new Error("File does not exist")
			}

			// If we should create directories
			if (options.ensureDirectory) {
				const dirPath = path.dirname(fullPath)
				try {
					await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath))
				} catch (err) {
					// Directory might already exist, that's fine
				}
			}

			// Create with provided content or empty string
			const content = options.content || ""
			await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"))
			return {
				type: "fileContent",
				content,
			}
		}
	} catch (error) {
		return {
			type: "error",
			error: error instanceof Error ? error.message : "Unknown error occurred",
		}
	}
}

export async function writeWorkspaceFile(
	relativePath: string,
	options: { create?: boolean; ensureDirectory?: boolean; content: string },
): Promise<ExtensionMessage> {
	try {
		// Get workspace root
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		console.log("Workspace root (write):", workspaceRoot)

		// If no workspace root, try to use the current working directory
		const effectiveRoot = workspaceRoot || process.cwd()
		console.log("Effective root (write):", effectiveRoot)

		// Resolve the full path
		const fullPath = path.join(effectiveRoot, relativePath)
		console.log("Full path (write):", fullPath)
		const uri = vscode.Uri.file(fullPath)
		console.log("URI (write):", uri.toString())

		// If we should create directories
		if (options.ensureDirectory) {
			const dirPath = path.dirname(fullPath)
			try {
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath))
			} catch (err) {
				// Directory might already exist, that's fine
			}
		}

		// Write the file
		await vscode.workspace.fs.writeFile(uri, Buffer.from(options.content, "utf8"))

		return {
			type: "fileContent",
			content: options.content,
		}
	} catch (error) {
		return {
			type: "error",
			error: error instanceof Error ? error.message : "Unknown error occurred",
		}
	}
}
