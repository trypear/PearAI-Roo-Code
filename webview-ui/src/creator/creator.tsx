import { useState, useCallback, useEffect, useRef } from "react"
import { vscode } from "../utils/vscode"
import { WebviewMessage } from "../../../src/shared/WebviewMessage"
import { ExtensionMessage, ClineMessage } from "../../../src/shared/ExtensionMessage"
import { Markdown } from "../components/ui/markdown"
import styled from "styled-components"

// Styled components for split view
const Container = styled.div`
	display: flex;
	height: 100vh;
	background: var(--vscode-editor-background);
	color: var(--vscode-foreground);
`

const ChatPanel = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 1rem;
	overflow: hidden;
`

interface TaskPlanPanelProps {
	visible: boolean
}

const TaskPlanPanel = styled.div<TaskPlanPanelProps>`
	width: 40%;
	border-left: 1px solid var(--vscode-sideBar-border);
	padding: 1rem;
	overflow-y: auto;
	background: var(--vscode-editor-background);
	display: ${(props) => (props.visible ? "block" : "none")};
	position: relative;

	opacity: ${(props) => (props.visible ? 1 : 0)};
	transition: opacity 0.3s ease-in-out;

	${(props) =>
		props.visible &&
		`
		border: 2px solid var(--vscode-textLink-foreground);
	`}
`

const TaskPlanHeader = styled.div`
	font-size: 1.2rem;
	font-weight: bold;
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid var(--vscode-sideBar-border);
`

const MessageContainer = styled.div`
	flex: 1;
	overflow-y: auto;
	margin-bottom: 1rem;
	padding-right: 0.5rem;
`

const Message = styled.div`
	margin: 0.5rem 0;
	padding: 0.75rem;
	border-radius: 0.375rem;
	max-width: 80%;

	&.user {
		margin-left: auto;
		background: #e64c9e;
		color: white;
	}

	&.assistant {
		background: var(--vscode-editor-background);
		border: 1px solid var(--vscode-input-border);
	}
`

const InputContainer = styled.div`
	display: flex;
	gap: 1rem;
	padding: 1rem;
	background: var(--vscode-editor-background);
	border: 1px solid var(--vscode-input-border);
	border-radius: 0.5rem;
`

const StyledTextArea = styled.textarea`
	width: 100%;
	padding: 0.5rem 1rem;
	background: var(--vscode-input-background);
	color: var(--vscode-input-foreground);
	border: none;
	border-radius: 0.5rem;
	resize: none;

	&:focus {
		outline: none;
		box-shadow: 0 0 0 2px #e64c9e;
	}
`

const SendButton = styled.button`
	padding: 0.5rem 1.5rem;
	background: #e64c9e;
	color: white;
	border: none;
	border-radius: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background: #d33c8e;
		transform: scale(1.05);
	}

	&:active:not(:disabled) {
		transform: scale(0.95);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const Creator = () => {
	const [messages, setMessages] = useState<ClineMessage[]>([])
	const [inputValue, setInputValue] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [taskPlan, setTaskPlan] = useState<string | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Add effect to log taskPlan changes
	useEffect(() => {
		console.log("[creator] TaskPlan state changed:", taskPlan)
	}, [taskPlan])

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const handleSendMessage = useCallback(
		(text: string) => {
			if (!text.trim() || isLoading) return

			// Add user message
			setMessages((prev) => [
				...prev,
				{
					type: "say",
					say: "text",
					text: text.trim(),
					ts: Date.now(),
				},
			])

			setIsLoading(true)

			// Send to extension
			vscode.postMessage({
				type: "newTask",
				text: text.trim(),
			})

			setInputValue("")
		},
		[isLoading],
	)

	const handleMessage = useCallback((e: MessageEvent<ExtensionMessage>) => {
		const message = e.data

		console.log("[creator] Received message:", message)

		if (message.type === "partialMessage" && message.partialMessage && "type" in message.partialMessage) {
			const partialMessage = message.partialMessage as ClineMessage
			// Only add the message if it's not a duplicate of the last message
			setMessages((prev) => {
				const lastMessage = prev[prev.length - 1]
				if (
					lastMessage &&
					lastMessage.type === partialMessage.type &&
					lastMessage.text === partialMessage.text
				) {
					return prev
				}
				return [...prev, partialMessage]
			})
			setIsLoading(false)
		} else if (message.type === "creator") {
			console.log("[creator] Updating task plan with:", message.text)
			// Only update task plan if it's different from current and not undefined
			const newText = message.text || null
			setTaskPlan((prev) => {
				console.log("[creator] Previous task plan:", prev)
				console.log("[creator] New task plan:", newText)
				return newText !== prev ? newText : prev
			})
		}
	}, [])

	useEffect(() => {
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [handleMessage])

	// Log render with current state
	console.log("[creator] Rendering with taskPlan:", taskPlan)

	return (
		<Container>
			<ChatPanel>
				<MessageContainer>
					{messages.map((msg, i) => (
						<Message
							key={`${msg.ts}-${i}`}
							className={msg.type === "say" && msg.say === "text" ? "user" : "assistant"}>
							<Markdown content={msg.text || ""} />
						</Message>
					))}

					{isLoading && (
						<div className="text-muted-foreground text-center py-4 animate-pulse">
							<div className="flex items-center justify-center gap-2">
								<div className="w-2 h-2 bg-[#E64C9E] rounded-full animate-bounce"></div>
								<div className="w-2 h-2 bg-[#E64C9E] rounded-full animate-bounce delay-100"></div>
								<div className="w-2 h-2 bg-[#E64C9E] rounded-full animate-bounce delay-200"></div>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</MessageContainer>

				<InputContainer>
					<StyledTextArea
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								handleSendMessage(inputValue)
							}
						}}
						placeholder="Type your message..."
						rows={1}
					/>
					<SendButton onClick={() => handleSendMessage(inputValue)} disabled={isLoading}>
						<span>Send</span>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</SendButton>
				</InputContainer>
			</ChatPanel>

			<TaskPlanPanel visible={taskPlan !== null}>
				<TaskPlanHeader>Task Plan</TaskPlanHeader>
				{taskPlan && (
					<>
						<div style={{ color: "var(--vscode-textLink-foreground)" }}>Plan Content:</div>
						<Markdown content={taskPlan} />
					</>
				)}
			</TaskPlanPanel>
		</Container>
	)
}

export default Creator
