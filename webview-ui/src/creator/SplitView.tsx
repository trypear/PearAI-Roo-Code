import React, { useEffect, useState, useCallback } from "react"
import styled from "styled-components"
import { vscEditorBackground, vscButtonBackground } from "@/components/ui"
import { vscode } from "@/utils/vscode"
import CodeBlock from "./CodeBlock"
import { getLanguageFromPath, normalizePath } from "@/utils/getLanguageFromPath"
import { WebviewMessage } from "../../../src/shared/WebviewMessage"

interface SplitViewProps {
	filePath: string // This is workspace-relative path
	onClose: () => void
}

interface FileContentMessage {
	type: "fileContent" | "error"
	content?: string
	error?: string
}

const SplitViewContainer = styled.div`
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	width: 50%;
	background-color: ${vscEditorBackground};
	border-left: 1px solid var(--vscode-editorGroup-border);
	display: flex;
	flex-direction: column;
	z-index: 1000;
`

const Header = styled.div`
	display: flex;
	align-items: center;
	padding: 12px;
	border-bottom: 1px solid var(--vscode-editorGroup-border);
`

const Title = styled.div`
	flex-grow: 1;
	font-weight: bold;
	margin-right: 12px;
`

const Content = styled.div`
	flex-grow: 1;
	overflow: auto;
	padding: 12px;
`

const StyledButton = styled.button`
	background-color: ${vscButtonBackground};
	color: var(--vscode-button-foreground);
	border: none;
	padding: 6px 12px;
	border-radius: 4px;
	cursor: pointer;
	margin-left: 8px;

	&:hover {
		opacity: 0.9;
	}
`

const SplitView: React.FC<SplitViewProps> = ({ filePath, onClose }) => {
	const [content, setContent] = useState<string>("")
	const [isEditing, setIsEditing] = useState(false)
	const [editedContent, setEditedContent] = useState("")
	const [error, setError] = useState<string | null>(null)

	// Ensure the path has the correct directory structure for display
	const normalizedPath = normalizePath(filePath)

	const handleMessage = useCallback((event: MessageEvent) => {
		const message = event.data
		console.log("SplitView received message:", message)

		if (message.type === "fileContent") {
			if (message.content !== undefined) {
				console.log("Setting content:", message.content)
				// Use functional updates to access the current state
				setIsEditing((currentIsEditing) => {
					if (currentIsEditing) {
						// This is a save confirmation
						setContent(message.content)
						setEditedContent(message.content)
						console.log("Save operation completed successfully")
						return false // Exit edit mode
					} else {
						// Initial file load
						setContent(message.content)
						setEditedContent(message.content)
						return currentIsEditing // Keep current edit state
					}
				})
				setError(null)
			}
		} else if (message.type === "error") {
			console.log("Received error:", message.error)
			setIsEditing((currentIsEditing) => {
				if (!currentIsEditing) {
					// Only clear content if this was a read operation
					console.log("Read operation failed, clearing content")
					setContent("")
					setEditedContent("")
				} else {
					console.log("Save operation failed")
				}
				return currentIsEditing // Keep current edit state
			})
			setError(message.error || "Operation failed")
		}
	}, []) // Remove isEditing from dependencies

	// Log when the component mounts and unmounts
	useEffect(() => {
		console.log("SplitView mounted with filepath:", filePath)
		return () => {
			console.log("SplitView unmounted")
		}
	}, [filePath])

	useEffect(() => {
		console.log("Setting up message listener and initiating file read")
		window.addEventListener("message", handleMessage)

		// Read the file
		console.log("Sending readWorkspaceFile message for path:", filePath)
		try {
			vscode.postMessage({
				type: "readWorkspaceFile",
				values: {
					relativePath: filePath,
					create: true,
					ensureDirectory: true,
					content: "",
				},
			})
			console.log("Successfully sent readWorkspaceFile message")
		} catch (error) {
			console.error("Error sending readWorkspaceFile message:", error)
			setError("Failed to send file read request")
		}

		// Cleanup
		return () => {
			console.log("Cleaning up message listener")
			window.removeEventListener("message", handleMessage)
		}
	}, [filePath, handleMessage])

	const handleSave = useCallback(() => {
		console.log("Initiating save for file:", filePath)
		console.log("Content length:", editedContent.length)

		try {
			// Don't exit edit mode until we get confirmation
			const message: WebviewMessage = {
				type: "writeWorkspaceFile",
				values: {
					relativePath: filePath,
					create: true,
					ensureDirectory: true,
					content: editedContent,
				},
			}
			vscode.postMessage(message)
			console.log("Successfully sent writeWorkspaceFile message")
		} catch (error) {
			console.error("Error sending writeWorkspaceFile message:", error)
			setError("Failed to send file save request")
		}
	}, [filePath, editedContent])

	const language = getLanguageFromPath(normalizedPath)

	return (
		<SplitViewContainer>
			<Header>
				<Title>{normalizedPath}</Title>
				{isEditing ? (
					<>
						<StyledButton onClick={handleSave}>Save</StyledButton>
						<StyledButton onClick={() => setIsEditing(false)}>Cancel</StyledButton>
					</>
				) : (
					<StyledButton onClick={() => setIsEditing(true)}>Edit</StyledButton>
				)}
				<StyledButton onClick={onClose}>Close</StyledButton>
			</Header>
			<Content>
				{error && !isEditing && (
					<div style={{ color: "var(--vscode-errorForeground)", marginBottom: "12px" }}>{error}</div>
				)}
				{isEditing ? (
					<textarea
						value={editedContent}
						onChange={(e) => setEditedContent(e.target.value)}
						style={{
							width: "100%",
							height: "100%",
							backgroundColor: "var(--vscode-editor-background)",
							color: "var(--vscode-editor-foreground)",
							border: "none",
							padding: "8px",
							fontFamily: "monospace",
							resize: "none",
						}}
					/>
				) : (
					<CodeBlock source={`${"```"}${language}\n${content}\n${"```"}`} />
				)}
			</Content>
		</SplitViewContainer>
	)
}

export default SplitView
