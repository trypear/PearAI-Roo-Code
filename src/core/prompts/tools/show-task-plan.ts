export function getShowTaskPlanDescription(): string {
	return `## show_task_plan
Description: Shows a markdown file containing the task plan in the creator mode GUI. This tool is used to present task plans to the user for review.
Parameters:
- path: (required) The path to the markdown file containing the task plan
Usage:
<show_task_plan>
<path>Path to markdown file here</path>
</show_task_plan>

Example: Showing a task plan
<show_task_plan>
<path>task-plan.md</path>
</show_task_plan>`
}
