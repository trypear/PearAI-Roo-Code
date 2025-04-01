import CodeBlock, { CODE_BLOCK_BG_COLOR } from "./CodeBlock"
import { getLanguageFromPath } from "@/utils/getLanguageFromPath"
import { useMemo, memo } from "react"
import { Button } from "@/components/ui"

interface CodeAccordianProps {
	code?: string
	diff?: string
	language?: string | undefined
	path?: string
	isFeedback?: boolean
	isConsoleLogs?: boolean
	isExpanded: boolean
	onToggleExpand: () => void
	isLoading?: boolean
	onEditPlan?: (path: string) => void
}

/*
We need to remove leading non-alphanumeric characters from the path in order for our leading ellipses trick to work.
^: Anchors the match to the start of the string.
[^a-zA-Z0-9]+: Matches one or more characters that are not alphanumeric.
The replace method removes these matched characters, effectively trimming the string up to the first alphanumeric character.
*/
export const removeLeadingNonAlphanumeric = (path: string): string => path.replace(/^[^a-zA-Z0-9]+/, "")

const CodeAccordian = ({
	code,
	diff,
	language,
	path,
	isFeedback,
	isConsoleLogs,
	isExpanded,
	onToggleExpand,
	isLoading,
	onEditPlan,
}: CodeAccordianProps) => {
	const inferredLanguage = useMemo(
		() => code && (language ?? (path ? getLanguageFromPath(path) : undefined)),
		[path, language, code],
	)

	return (
		<div
			style={{
				overflow: "hidden", // This ensures the inner scrollable area doesn't overflow the rounded corners
				// border: "1px solid var(--vscode-editorGroup-border)",
			}}>
			{(path || isFeedback || isConsoleLogs) && (
				<div
					style={{
						// color: "var(--vscode-descriptionForeground)",
						display: "flex",
						alignItems: "center",
						padding: "9px 10px",
						cursor: isLoading ? "wait" : "pointer",
						opacity: isLoading ? 0.7 : 1,
						// pointerEvents: isLoading ? "none" : "auto",
						userSelect: "none",
						WebkitUserSelect: "none",
						MozUserSelect: "none",
						msUserSelect: "none",
						borderRadius: 8,
						marginBottom: 8,
						backgroundColor: CODE_BLOCK_BG_COLOR,
					}}
					onClick={isLoading ? undefined : onToggleExpand}>
					{isFeedback || isConsoleLogs ? (
						<div style={{ display: "flex", alignItems: "center" }}>
							<span
								className={`codicon codicon-${isFeedback ? "feedback" : "output"}`}
								style={{ marginRight: "6px" }}></span>
							<span
								style={{
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
									marginRight: "8px",
								}}>
								{isFeedback ? "User Edits" : "Console Logs"}
							</span>
						</div>
					) : (
						<>
							{path?.startsWith(".") && <span>.</span>}
							<span
								style={{
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
									marginRight: "8px",
									// trick to get ellipsis at beginning of string
									direction: "rtl",
									textAlign: "left",
								}}
								className="font-bold">
								{/* {removeLeadingNonAlphanumeric(path ?? "") + "\u200E"} */}
								{path}
							</span>
						</>
					)}
					<div style={{ flexGrow: 1 }}></div>
					{path && !isFeedback && !isConsoleLogs && (
						<Button
							onClick={(e) => {
								e.stopPropagation()
								onEditPlan?.(path)
							}}
							style={{
								marginRight: "8px",
								padding: "4px 8px",
								fontSize: "12px",
							}}>
							Edit Plan
						</Button>
					)}
					<span className={`codicon codicon-chevron-${isExpanded ? "up" : "down"}`}></span>
				</div>
			)}
			{(!(path || isFeedback || isConsoleLogs) || isExpanded) && (
				<div
					//className="code-block-scrollable" this doesn't seem to be necessary anymore, on silicon macs it shows the native mac scrollbar instead of the vscode styled one
					style={{
						overflowX: "auto",
						overflowY: "hidden",
						maxWidth: "100%",
						borderRadius: 8,
					}}>
					<CodeBlock
						source={`${"```"}${diff !== undefined ? "diff" : inferredLanguage}\n${(
							code ??
							diff ??
							""
						).trim()}\n${"```"}`}
					/>
				</div>
			)}
		</div>
	)
}

// memo does shallow comparison of props, so if you need it to re-render when a nested object changes, you need to pass a custom comparison function
export default memo(CodeAccordian)
