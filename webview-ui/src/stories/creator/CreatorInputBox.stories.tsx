import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { InputBox } from "../../creatorOverlay/inputBox"
import { useRef, useState } from "react"
import { action } from "@storybook/addon-actions"

const meta: Meta<typeof InputBox> = {
	title: "Components/InputBox",
	component: InputBox,
	parameters: {
		layout: "centered",
		backgrounds: {
			default: "light",
		},
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div className="w-[800px] border border-gray-200 rounded-lg shadow-md">
				<Story />
			</div>
		),
	],
}

export default meta
type Story = StoryObj<typeof InputBox>

// Wrapper component to handle state
const InputBoxWithState = ({ initialText = "", isDisabled = false }) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [message, setMessage] = useState(initialText)

	const handleRequest = () => {
		action("handleRequest")(message)
		if (!isDisabled) {
			setMessage("")
		}
	}

	return (
		<InputBox
			textareaRef={textareaRef}
			initialMessage={message}
			setInitialMessage={setMessage}
			handleRequest={handleRequest}
			isDisabled={isDisabled}
		/>
	)
}

export const Default: Story = {
	render: () => <InputBoxWithState />,
}

export const WithInitialText: Story = {
	render: () => <InputBoxWithState initialText="Build a website with React and Tailwind" />,
}

export const Disabled: Story = {
	render: () => <InputBoxWithState isDisabled={true} />,
}

export const LongText: Story = {
	render: () => (
		<InputBoxWithState initialText="This is an example of a longer message that demonstrates how the textarea expands to accommodate more content. The textarea should resize up to a certain point before enabling scrolling." />
	),
}

// Create a proper React component for the interactive story
const InteractiveExample = () => {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [message, setMessage] = useState("")
	const [responses, setResponses] = useState<string[]>([])

	const handleRequest = () => {
		if (message.trim()) {
			setResponses([...responses, message])
			setMessage("")

			// Focus the textarea after submitting
			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.focus()
				}
			}, 0)
		}
	}

	return (
		<div className="flex flex-col">
			{responses.length > 0 && (
				<div className="p-4 bg-gray-50 max-h-[300px] overflow-y-auto">
					{responses.map((response, index) => (
						<div key={index} className="mb-2 p-2 bg-white rounded border border-gray-200">
							{response}
						</div>
					))}
				</div>
			)}
			<InputBox
				textareaRef={textareaRef}
				initialMessage={message}
				setInitialMessage={setMessage}
				handleRequest={handleRequest}
				isDisabled={false}
			/>
		</div>
	)
}

export const Interactive: Story = {
	render: () => <InteractiveExample />,
}

// Create a proper React component for the button variations story
const ButtonVariationsExample = () => {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [message, setMessage] = useState("")
	const [planToggled, setPlanToggled] = useState(false)

	const handleRequest = () => {
		action("handleRequest")(message)
		setMessage("")
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="p-4 bg-gray-50">
				<h3 className="font-medium mb-2">Make a Plan Button Toggle State: {planToggled ? "On" : "Off"}</h3>
				<button className="bg-gray-200 px-3 py-1 rounded text-sm" onClick={() => setPlanToggled(!planToggled)}>
					Toggle Plan Button State
				</button>
			</div>

			<InputBox
				textareaRef={textareaRef}
				initialMessage={message}
				setInitialMessage={setMessage}
				handleRequest={handleRequest}
				isDisabled={false}
			/>
		</div>
	)
}

// Showcase different button combinations
export const ButtonVariations: Story = {
	render: () => <ButtonVariationsExample />,
}
