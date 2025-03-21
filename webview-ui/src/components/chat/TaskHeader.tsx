import React, { memo, useEffect, useMemo, useRef, useState } from "react"
import { useWindowSize } from "react-use"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import prettyBytes from "pretty-bytes"

import { ClineMessage } from "../../../../src/shared/ExtensionMessage"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import Thumbnails from "../common/Thumbnails"
import { mentionRegexGlobal } from "../../../../src/shared/context-mentions"
import { formatLargeNumber } from "../../utils/format"
import { normalizeApiConfiguration } from "../settings/ApiOptions"
import { Button } from "../ui"
import { HistoryItem } from "../../../../src/shared/HistoryItem"
import { usePearAiModels } from "../../hooks/usePearAiModels"
import { BackspaceIcon, ChatBubbleOvalLeftIcon } from "@heroicons/react/24/outline"
import { vscBadgeBackground, vscEditorBackground, vscInputBackground } from "../ui"
import { DownloadIcon } from "@radix-ui/react-icons"
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons"
import { Tail } from "../ui/tail"

interface TaskHeaderProps {
	task: ClineMessage
	tokensIn: number
	tokensOut: number
	doesModelSupportPromptCache: boolean
	cacheWrites?: number
	cacheReads?: number
	totalCost: number
	contextTokens: number
	onClose: () => void
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
	task,
	tokensIn,
	tokensOut,
	doesModelSupportPromptCache,
	cacheWrites,
	cacheReads,
	totalCost,
	contextTokens,
	onClose,
}) => {
	const { apiConfiguration, currentTaskItem } = useExtensionState()
	const pearAiModels = usePearAiModels(apiConfiguration)
	const { selectedModelInfo } = useMemo(
		() => normalizeApiConfiguration(apiConfiguration, pearAiModels),
		[apiConfiguration, pearAiModels],
	)
	const [isTaskExpanded, setIsTaskExpanded] = useState(true)
	const [isTextExpanded, setIsTextExpanded] = useState(false)
	const [showSeeMore, setShowSeeMore] = useState(false)
	const textContainerRef = useRef<HTMLDivElement>(null)
	const textRef = useRef<HTMLDivElement>(null)
	const contextWindow = selectedModelInfo?.contextWindow || 1

	/*
	When dealing with event listeners in React components that depend on state variables, we face a challenge. We want our listener to always use the most up-to-date version of a callback function that relies on current state, but we don't want to constantly add and remove event listeners as that function updates. This scenario often arises with resize listeners or other window events. Simply adding the listener in a useEffect with an empty dependency array risks using stale state, while including the callback in the dependencies can lead to unnecessary re-registrations of the listener. There are react hook libraries that provide a elegant solution to this problem by utilizing the useRef hook to maintain a reference to the latest callback function without triggering re-renders or effect re-runs. This approach ensures that our event listener always has access to the most current state while minimizing performance overhead and potential memory leaks from multiple listener registrations.
	Sources
	- https://usehooks-ts.com/react-hook/use-event-listener
	- https://streamich.github.io/react-use/?path=/story/sensors-useevent--docs
	- https://github.com/streamich/react-use/blob/master/src/useEvent.ts
	- https://stackoverflow.com/questions/55565444/how-to-register-event-with-useeffect-hooks

	Before:

	const updateMaxHeight = useCallback(() => {
		if (isExpanded && textContainerRef.current) {
			const maxHeight = window.innerHeight * (3 / 5)
			textContainerRef.current.style.maxHeight = `${maxHeight}px`
		}
	}, [isExpanded])

	useEffect(() => {
		updateMaxHeight()
	}, [isExpanded, updateMaxHeight])

	useEffect(() => {
		window.removeEventListener("resize", updateMaxHeight)
		window.addEventListener("resize", updateMaxHeight)
		return () => {
			window.removeEventListener("resize", updateMaxHeight)
		}
	}, [updateMaxHeight])

	After:
	*/

	const { height: windowHeight, width: windowWidth } = useWindowSize()

	useEffect(() => {
		if (isTextExpanded && textContainerRef.current) {
			const maxHeight = windowHeight * (1 / 2)
			textContainerRef.current.style.maxHeight = `${maxHeight}px`
		}
	}, [isTextExpanded, windowHeight])

	useEffect(() => {
		if (textRef.current && textContainerRef.current) {
			let textContainerHeight = textContainerRef.current.clientHeight
			if (!textContainerHeight) {
				textContainerHeight = textContainerRef.current.getBoundingClientRect().height
			}
			const isOverflowing = textRef.current.scrollHeight > textContainerHeight
			// necessary to show see more button again if user resizes window to expand and then back to collapse
			if (!isOverflowing) {
				setIsTextExpanded(false)
			}
			setShowSeeMore(isOverflowing)
		}
	}, [task.text, windowWidth])

	const isCostAvailable = useMemo(() => {
		return (
			apiConfiguration?.apiProvider !== "openai" &&
			apiConfiguration?.apiProvider !== "ollama" &&
			apiConfiguration?.apiProvider !== "lmstudio" &&
			apiConfiguration?.apiProvider !== "gemini"
		)
	}, [apiConfiguration?.apiProvider])

	const shouldShowPromptCacheInfo = doesModelSupportPromptCache && apiConfiguration?.apiProvider !== "openrouter"

	return (
		<div style={{ padding: "10px 13px 10px 13px" }}>
			<div
				style={{
					backgroundColor: vscEditorBackground,
					color: "var(--vscode-badge-foreground)",
					borderRadius: "12px",
					padding: "12px",
					display: "flex",
					flexDirection: "column",
					gap: 6,
					position: "relative",
					zIndex: 1,
					width: "60%",
					marginLeft: "auto",
				}}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							cursor: "pointer",
							marginLeft: -2,
							userSelect: "none",
							WebkitUserSelect: "none",
							MozUserSelect: "none",
							msUserSelect: "none",
							flexGrow: 1,
							minWidth: 0, // This allows the div to shrink below its content size
						}}
						onClick={() => setIsTaskExpanded(!isTaskExpanded)}>
						{/* <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
							<span className={`codicon codicon-chevron-${isTaskExpanded ? "down" : "right"}`}></span>
						</div> */}
						<div
							style={{
								// marginLeft: 6,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								flexGrow: 1,
								minWidth: 0, // This allows the div to shrink below its content size
							}}>
							<span style={{ fontWeight: "bold", color: "var(--vscode-descriptionForeground)" }}>
								TASK
								{!isTaskExpanded && ":"}
							</span>
							{!isTaskExpanded && (
								<span style={{ marginLeft: 4 }}>{highlightMentions(task.text, false)}</span>
							)}
						</div>
					</div>
					{!isTaskExpanded && isCostAvailable && (
						<div
							style={{
								marginLeft: 10,
								backgroundColor: "color-mix(in srgb, var(--vscode-badge-foreground) 70%, transparent)",
								color: "var(--vscode-badge-background)",
								padding: "2px 4px",
								borderRadius: "500px",
								fontSize: "11px",
								fontWeight: 500,
								display: "inline-block",
								flexShrink: 0,
							}}>
							${totalCost?.toFixed(4)}
						</div>
					)}
					<div
						className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg"
						style={{ backgroundColor: "var(--vscode-list-hoverBackground)" }}>
						{isCostAvailable && (
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}>
								<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
									{/* <span style={{ fontWeight: "bold" }}>API Cost:</span> */}
									<span>${totalCost?.toFixed(4)}</span>
								</div>
							</div>
						)}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								// marginLeft: "auto",
							}}>
							<div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
								{/* <span style={{ }}>Tokens:</span> */}
								<span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
									<i
										className="codicon codicon-arrow-up"
										style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "-2px" }}
									/>
									{formatLargeNumber(tokensIn || 0)}
								</span>
								<span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
									<i
										className="codicon codicon-arrow-down"
										style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "-2px" }}
									/>
									{formatLargeNumber(tokensOut || 0)}
								</span>
							</div>
						</div>
					</div>
					<div className="ml-2">
						<ExportButton />
					</div>
					{/* <VSCodeButton appearance="icon" onClick={onClose} style={{ marginLeft: 6, flexShrink: 0 }}>
						<span className="codicon codicon-close"></span>
					</VSCodeButton> */}
				</div>
				{isTaskExpanded && (
					<>
						<div
							ref={textContainerRef}
							style={{
								marginTop: -2,
								fontSize: "var(--vscode-font-size)",
								overflowY: isTextExpanded ? "auto" : "hidden",
								wordBreak: "break-word",
								overflowWrap: "anywhere",
								position: "relative",
							}}>
							<div
								ref={textRef}
								style={{
									display: "-webkit-box",
									WebkitLineClamp: isTextExpanded ? "unset" : 3,
									WebkitBoxOrient: "vertical",
									overflow: "hidden",
									whiteSpace: "pre-wrap",
									wordBreak: "break-word",
									overflowWrap: "anywhere",
								}}>
								{highlightMentions(task.text, false)}
							</div>
							{!isTextExpanded && showSeeMore && (
								<div
									style={{
										position: "absolute",
										right: 0,
										bottom: 0,
										display: "flex",
										alignItems: "center",
									}}>
									{/* <div
										style={{
											width: 30,
											height: "1.2em",
											background:
												"linear-gradient(to right, transparent, var(--vscode-badge-background))",
										}}
									/> */}
								</div>
							)}
						</div>
						{isTextExpanded && showSeeMore && (
							<div
								style={{
									cursor: "pointer",
									color: "var(--vscode-textLink-foreground)",
									marginLeft: "auto",
									textAlign: "right",
									paddingRight: 2,
								}}
								onClick={() => setIsTextExpanded(!isTextExpanded)}>
								See less
							</div>
						)}

						{task.images && task.images.length > 0 && <Thumbnails images={task.images} />}

						<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
							<div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
								{/* <span
									style={{
										display: "flex",
										alignItems: "center",
										gap: "3px",
										padding: 4,
										backgroundColor: vscInputBackground,
										borderRadius: 4,
										marginLeft: "auto",
									}}
									className="text-xs">
									Context
									<ChevronDownIcon />
								</span> */}

								{/* <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
									{contextTokens ? `${formatLargeNumber(contextTokens)} (${contextPercentage}%)` : ""}
								</span> */}
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									gap: "4px",
									flexWrap: "wrap",
								}}>
								<div
									style={{
										cursor: "pointer",
										color: "var(--vscode-textLink-foreground)",
										backgroundColor: vscEditorBackground,
										stroke: "var(--vscode-editor-foreground)",
										marginLeft: "auto",
									}}
									onClick={() => setIsTextExpanded(!isTextExpanded)}>
									<ChevronDownIcon />
								</div>

								{!isCostAvailable && (
									<div style={{}}>
										<ExportButton />
									</div>
								)}
							</div>

							{shouldShowPromptCacheInfo && (cacheReads !== undefined || cacheWrites !== undefined) && (
								<div className="flex items-center gap-1 flex-wrap h-[20px]">
									<span style={{ fontWeight: "bold" }}>Cache:</span>
									<span className="flex items-center gap-1">
										<i
											className="codicon codicon-database"
											style={{ fontSize: "12px", fontWeight: "bold" }}
										/>
										+{formatLargeNumber(cacheWrites || 0)}
									</span>
									<span className="flex items-center gap-1">
										<i
											className="codicon codicon-arrow-right"
											style={{ fontSize: "12px", fontWeight: "bold" }}
										/>
										{formatLargeNumber(cacheReads || 0)}
									</span>
								</div>
							)}

							{isCostAvailable && (
								<div className="flex justify-between items-center h-[20px]">
									<div className="flex items-center gap-1">
										<span className="font-bold">API Cost:</span>
										<span>${totalCost?.toFixed(4)}</span>
									</div>
									<TaskActions item={currentTaskItem} />
								</div>
							)}
						</div>
					</>
				)}
				<Tail />
			</div>
			{/* {apiProvider === "" && (
				<div
					style={{
						backgroundColor: "color-mix(in srgb, var(--vscode-badge-background) 50%, transparent)",
						color: "var(--vscode-badge-foreground)",
						borderRadius: "0 0 3px 3px",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "4px 12px 6px 12px",
						fontSize: "0.9em",
						marginLeft: "10px",
						marginRight: "10px",
					}}>
					<div style={{ fontWeight: "500" }}>Credits Remaining:</div>
					<div>
						{formatPrice(Credits || 0)}
						{(Credits || 0) < 1 && (
							<>
								{" "}
								<VSCodeLink style={{ fontSize: "0.9em" }} href={getAddCreditsUrl(vscodeUriScheme)}>
									(get more?)
								</VSCodeLink>
							</>
						)}
					</div>
				</div>
			)} */}
		</div>
	)
}

export const highlightMentions = (text?: string, withShadow = true) => {
	if (!text) return text
	const parts = text.split(mentionRegexGlobal)
	return parts.map((part, index) => {
		if (index % 2 === 0) {
			// This is regular text
			return part
		} else {
			// This is a mention
			return (
				<span
					key={index}
					className={withShadow ? "mention-context-highlight-with-shadow" : "mention-context-highlight"}
					style={{ cursor: "pointer" }}
					onClick={() => vscode.postMessage({ type: "openMention", text: part })}>
					@{part}
				</span>
			)
		}
	})
}

const TaskActions = ({ item }: { item: HistoryItem | undefined }) => (
	<div className="flex flex-row gap-1">
		<Button variant="ghost" size="sm" onClick={() => vscode.postMessage({ type: "exportCurrentTask" })}>
			<span className="codicon codicon-cloud-download" />
		</Button>
		{!!item?.size && item.size > 0 && (
			<Button
				variant="ghost"
				size="sm"
				onClick={() => vscode.postMessage({ type: "deleteTaskWithId", text: item.id })}>
				<span className="codicon codicon-trash" />
				{prettyBytes(item.size)}
			</Button>
		)}
	</div>
)

const ContextWindowProgress = ({ contextWindow, contextTokens }: { contextWindow: number; contextTokens: number }) => (
	<>
		<div className="flex items-center gap-1 flex-shrink-0">
			<span className="font-bold">Context Window:</span>
		</div>
		<div className="flex items-center gap-2 flex-1 whitespace-nowrap">
			<div>{formatLargeNumber(contextTokens)}</div>
			<div className="flex items-center gap-[3px] flex-1">
				<div className="flex-1 h-1 rounded-[2px] overflow-hidden bg-[color-mix(in_srgb,var(--vscode-badge-foreground)_20%,transparent)]">
					<div
						className="h-full rounded-[2px] bg-[var(--vscode-badge-foreground)]"
						style={{
							width: `${(contextTokens / contextWindow) * 100}%`,
							transition: "width 0.3s ease-out",
						}}
					/>
				</div>
			</div>
			<div>{formatLargeNumber(contextWindow)}</div>
		</div>
	</>
)

const ExportButton = () => (
	<div
		onClick={() => vscode.postMessage({ type: "exportCurrentTask" })}
		style={{
			marginBottom: "-5px",
			marginRight: "-2.5px",
			cursor: "pointer",
		}}>
		<DownloadIcon style={{ width: "16px", height: "16px" }} />
	</div>
)

export default memo(TaskHeader)
