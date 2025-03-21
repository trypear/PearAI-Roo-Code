import { useState, useCallback, useEffect, useRef } from "react"
import { vscode } from "../utils/vscode"
import { WebviewMessage } from "../../../src/shared/WebviewMessage"
import { ExtensionMessage, ClineMessage } from "../../../src/shared/ExtensionMessage"
import { Markdown } from "../components/ui/markdown"

interface Message {
	role: "user" | "assistant"
	content: string
	timestamp: number
}

const Creator = () => {
	const [prompt, setPrompt] = useState("")
	const [isProcessing, setIsProcessing] = useState(false)
	const [response, setResponse] = useState<ClineMessage | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [inputValue, setInputValue] = useState("")
	const messagesEndRef = useRef<HTMLDivElement>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!prompt.trim() || isProcessing) return

		setIsProcessing(true)
		try {
			const message: WebviewMessage = {
				type: "creator",
				text: prompt.trim(),
			}
			await vscode.postMessage(message)
			setPrompt("")
		} finally {
			setIsProcessing(false)
		}
	}

	const handleMessage = useCallback((e: MessageEvent<ExtensionMessage>) => {
		const message = e.data
		if (message.type === "partialMessage" && message.partialMessage) {
			setResponse(message.partialMessage)
		}
	}, [])

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const handleSendMessage = useCallback((text: string) => {
		if (!text.trim()) return

		// Add user message to chat
		setMessages((prev) => [
			...prev,
			{
				role: "user",
				content: text.trim(),
				timestamp: Date.now(),
			},
		])

		setIsLoading(true)

		// Send message to extension
		vscode.postMessage({
			type: "newTask",
			text: text.trim(),
		})
	}, [])

	// Add message event listener
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data

			if (message.type === "partialMessage" && message.partialMessage) {
				// Handle streaming response
				setMessages((prev) => {
					const lastMessage = prev[prev.length - 1]
					if (lastMessage?.role === "assistant") {
						// Update existing assistant message
						return [
							...prev.slice(0, -1),
							{
								...lastMessage,
								content: lastMessage.content + message.partialMessage.text,
							},
						]
					} else {
						// Add new assistant message
						return [
							...prev,
							{
								role: "assistant",
								content: message.partialMessage.text || "",
								timestamp: Date.now(),
							},
						]
					}
				})
				setIsLoading(false)
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [])

	return (
		<div className="flex flex-col h-screen p-4 bg-background text-foreground">
			{/* Messages container with scrolling */}
			<div className="flex-1 overflow-y-auto space-y-4 mb-4">
				{messages.map((msg, i) => (
					<div
						key={msg.timestamp}
						className={`max-w-[80%] rounded-lg p-4 animate-fade-in transition-all duration-200 ease-in-out hover:shadow-lg ${
							msg.role === "user"
								? "ml-auto bg-[#E64C9E] text-white hover:bg-[#D33C8E]"
								: "bg-editor-background border border-input-border hover:border-[#E64C9E]"
						}`}>
						{/* Use Markdown component for messages */}
						<Markdown content={msg.content} />
					</div>
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

				{/* Scroll anchor */}
				<div ref={messagesEndRef} />
			</div>

			{/* Input container */}
			<div className="flex items-end gap-4 mt-auto p-4 bg-editor-background rounded-lg border border-input-border">
				<div className="flex-1">
					<textarea
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								handleSendMessage(inputValue)
								setInputValue("")
							}
						}}
						placeholder="Type your message..."
						rows={1}
						className="w-full px-4 py-2 rounded-lg bg-input-background text-input-foreground border-none focus:outline-none focus:ring-2 focus:ring-[#E64C9E] resize-none"
					/>
				</div>
				<button
					onClick={() => {
						handleSendMessage(inputValue)
						setInputValue("")
					}}
					disabled={isLoading}
					className="px-6 py-2 bg-[#E64C9E] text-white rounded-lg flex items-center gap-2 hover:bg-[#D33C8E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95">
					<span>Send</span>
					<svg
						className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				</button>
			</div>
		</div>
	)
}

export default Creator
