import { vscode } from "@/utils/vscode"
import { EnterIcon } from "@radix-ui/react-icons"
import { Sun } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

/**
 * CreatorOverlay component provides a full-screen overlay with an auto-focusing input field
 * for capturing user commands or queries.
 *
 * - This automatically captures keystrokes and redirects them to the input
 * - Global keyboard handling: Captures keyboard input even when the textarea isn't focused
 * - Automatic text area resizing
 * - Escape key closes the overlay
 * - Enter submits the request
 * - Clicking the background closes the overlay
 */
export const CreatorOverlay = () => {
	const [text, setText] = useState("")
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)
	const isCapturingRef = useRef(false)

	const close = useCallback(() => {
		vscode.postMessage({
			type: "pearAiCloseCreatorInterface",
		})
		setText("")
	}, [])

	const forceFocus = useCallback(() => {
		if (!textareaRef.current) return

		try {
			textareaRef.current.focus()
			textareaRef.current.focus({ preventScroll: false })
			textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
		} catch (e) {
			console.error("Focus attempt failed:", e)
		}
	}, [])

	useEffect(() => {
		vscode.postMessage({
			type: "pearAiHideCreatorLoadingOverlay",
		})

		forceFocus()

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				close()
				return
			}

			if (document.activeElement === textareaRef.current) {
				return
			}

			if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
				e.preventDefault()
				e.stopPropagation()

				forceFocus()

				if (!isCapturingRef.current) {
					setText((prevText) => prevText + e.key)
					isCapturingRef.current = true

					setTimeout(() => {
						isCapturingRef.current = false
					}, 100)
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown, { capture: true })

		return () => {
			window.removeEventListener("keydown", handleKeyDown, { capture: true })
		}
	}, [close, forceFocus])

	const handleRequest = useCallback(() => {
		if (text.trim()) {
			vscode.postMessage({
				type: "newTask",
				text,
			})
			close()
		}
	}, [text, close])

	const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setText(e.target.value)

		const textarea = e.target
		textarea.style.height = "36px"
		const scrollHeight = textarea.scrollHeight
		textarea.style.height = Math.min(scrollHeight, 100) + "px"
	}, [])

	const handleTextareaKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey && text.trim()) {
				e.preventDefault()
				handleRequest()
			}
		},
		[handleRequest, text],
	)

	return (
		<div onClick={close} className="fixed inset-0 flex items-center justify-center">
			<div className="relative mx-4 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
				<div className="absolute -top-10 -right-10 -bottom-10 -left-10 -z-10 grid grid-cols-2 overflow-hidden rounded-3xl blur-xl opacity-50">
					<div className="bg-gradient-to-br from-pink-500 to-blue-600"></div>
					<div className="bg-gradient-to-tr from-blue-600 to-cyan-400"></div>
				</div>

				<div className="relative z-10 flex items-center rounded-full bg-white p-2 shadow-lg">
					<div className="flex-1 px-4">
						<textarea
							ref={textareaRef}
							value={text}
							onChange={handleTextareaChange}
							onKeyDown={handleTextareaKeyDown}
							placeholder="What would you like to do?"
							className="w-full appearance-none bg-transparent text-gray-700 outline-none focus:outline-none resize-none overflow-y-auto rounded-lg min-h-9 h-9 max-h-24 leading-normal py-2 px-2 flex items-center border-none"
							autoFocus={true}
							tabIndex={1}
							rows={1}
						/>
					</div>

					<div className="flex items-center space-x-2 px-2">
						<button
							className="flex cursor-pointer gap-2 rounded-md px-4 py-2 text-gray-400 transition-colours duration-200 hover:bg-gray-100"
							tabIndex={2}>
							<Sun className="h-4 w-4" />
							<div className="flex-1">Suggest</div>
						</button>
						<button
							onClick={handleRequest}
							disabled={!text.trim()}
							className="flex cursor-pointer gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colours duration-200 hover:bg-gray-900 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
							tabIndex={3}>
							<EnterIcon className="h-4 w-4" />
							<div className="flex-1">Start</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
