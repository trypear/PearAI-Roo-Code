import { EnterIcon } from "@radix-ui/react-icons"
import { Sun } from "lucide-react"
import React, { useCallback } from "react"

interface InputBoxProps {
	textareaRef: React.RefObject<HTMLTextAreaElement>
	initialMessage: string
	setInitialMessage: (value: string) => void
	handleRequest: () => void
	isDisabled: boolean
}

export const InputBox: React.FC<InputBoxProps> = ({
	textareaRef,
	initialMessage,
	setInitialMessage,
	handleRequest,
	isDisabled,
}) => {
	const handleTextareaChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setInitialMessage(e.target.value)

			const textarea = e.target
			textarea.style.height = "36px"
			const scrollHeight = textarea.scrollHeight
			textarea.style.height = Math.min(scrollHeight, 100) + "px"
		},
		[setInitialMessage],
	)

	const handleTextareaKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey && initialMessage.trim()) {
				e.preventDefault()
				handleRequest()
			}
		},
		[handleRequest, initialMessage],
	)

	return (
		<div className="flex items-center rounded-full bg-white p-2">
			<div className="flex-1 px-4">
				<textarea
					ref={textareaRef}
					value={initialMessage}
					onChange={handleTextareaChange}
					onKeyDown={handleTextareaKeyDown}
					placeholder="What would you like to do?"
					className="w-full appearance-none bg-transparent text-gray-700 outline-none focus:outline-none resize-none overflow-y-auto rounded-lg min-h-9 h-9 max-h-24 leading-normal py-2 px-2 flex items-center border-none"
					autoFocus={true}
					tabIndex={1}
					rows={1}
					disabled={isDisabled}
				/>
			</div>

			<div className="flex items-center space-x-2 px-2">
				<button
					className="flex cursor-pointer gap-2 rounded-md px-4 py-2 text-gray-400 transition-colours duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					tabIndex={2}
					disabled={isDisabled}>
					<Sun className="h-4 w-4" />
					<div className="flex-1">Suggest</div>
				</button>
				<button
					onClick={handleRequest}
					disabled={!initialMessage.trim() || isDisabled}
					className="flex cursor-pointer gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colours duration-200 hover:bg-gray-900 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
					tabIndex={3}>
					<EnterIcon className="h-4 w-4" />
					<div className="flex-1">Start</div>
				</button>
			</div>
		</div>
	)
}
