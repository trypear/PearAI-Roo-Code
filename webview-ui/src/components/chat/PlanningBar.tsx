import { CodeBracketIcon } from "@heroicons/react/24/outline"
import { Button } from "./button"
import { DocumentTextIcon as SolidDocumentTextIcon, StopCircleIcon, StopIcon } from "@heroicons/react/24/solid"
import { FC } from "react"
import { cn } from "@/lib/utils"
import { vscode } from "@src/utils/vscode"

export type PlanningBarProps = {
	isStreaming?: boolean
	requestedPlan: string
	stopCallback?: () => void
	className?: string
}

export const PlanningBar: FC<PlanningBarProps> = ({ isStreaming, requestedPlan, stopCallback, className }) => {
	return (
		<div
			className={cn(
				"bg-[#000] w-full rounded-full flex text-white justify-between min-w-64 h-10 gap-4 relative",
				className,
			)}>
			<div
				className={`${isStreaming ? "rainbow-border-glow-visible" : ""}
            absolute inset-0 rainbow-border-glow blur -z-10 rounded-full `}
			/>
			<div className="flex-1 flex h-full align-middle ml-5 gap-4 relative overflow-hidden">
				<div className="relative h-full my-auto mr-1 flex-shrink-0 min-w-4">
					<div className={`circle ${isStreaming ? "animated-circle" : ""}`} />
				</div>
				<div className="my-auto text-sm flex-shrink-0">Creating</div>
				<div className="relative my-auto min-w-0 flex-shrink overflow-hidden max-w-64">
					<div className="text-white/80 text-sm truncate">{requestedPlan}</div>
				</div>
			</div>

			<div className="flex justify-center align-middle mr-2 gap-4">
				<div className="m-auto flex gap-2">
					<div className="flex my-auto">
						<Button
							variant="default"
							toggled
							className="bg-black hover:bg-black rounded-r-none cursor-default">
							<SolidDocumentTextIcon />
						</Button>
						<Button className="rounded-l-none bg-blue-700/60 hover:bg-blue-700/60 cursor-default">
							<CodeBracketIcon />
						</Button>
					</div>

					<Button
						variant="default"
						className="my-auto"
						onClick={() => vscode.postMessage({ type: "openPearAICreatorFeedbackOverlay" })}>
						Not Working?
					</Button>
					<Button
						className="my-auto bg-red-500/20 hover:bg-red-500/40"
						disabled={!isStreaming}
						onClick={stopCallback}>
						<StopIcon className="fill-red-500" />
					</Button>
				</div>
				{/* <ArrowTurnDownLeftIcon className="size-4" /> */}
			</div>
		</div>
	)
}
