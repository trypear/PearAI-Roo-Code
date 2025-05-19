import path from "path"
import fs from "fs/promises"
import { Cline } from "../Cline"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { formatResponse } from "../prompts/responses"
import { getReadablePath } from "../../utils/path"
import { isPathOutsideWorkspace } from "../../utils/pathUtils"
import { fileExistsAtPath } from "../../utils/fs"

export async function pearaiDeployWebappTool(
    cline: Cline,
    block: ToolUse,
    askApproval: AskApproval,
    handleError: HandleError,
    pushToolResult: PushToolResult,
    removeClosingTag: RemoveClosingTag,
) {
    const zip_file_path: string | undefined = block.params.zip_file_path
    const env_file_path: string | undefined = block.params.env_file_path
    const site_id: string | undefined = block.params.site_id
    const isStatic: boolean = block.params.isStatic === "true"

    try {
        if (block.partial) {
            const partialMessage = JSON.stringify({
                tool: "pearai_deploy_webapp",
                zip_file_path: removeClosingTag("zip_file_path", zip_file_path),
                env_file_path: removeClosingTag("env_file_path", env_file_path),
                site_id: removeClosingTag("site_id", site_id),
                isStatic: removeClosingTag("isStatic", isStatic?.toString()),
            })

            await cline.ask("tool", partialMessage, block.partial).catch(() => {})
            return
        }

        // Validate required parameters
        if (!zip_file_path) {
            cline.consecutiveMistakeCount++
            cline.recordToolError("pearai_deploy_webapp")
            pushToolResult(await cline.sayAndCreateMissingParamError("pearai_deploy_webapp", "zip_file_path"))
            return
        }

        if (!env_file_path) {
            cline.consecutiveMistakeCount++
            cline.recordToolError("pearai_deploy_webapp")
            pushToolResult(await cline.sayAndCreateMissingParamError("pearai_deploy_webapp", "env_file_path"))
            return
        }

        // Check if files exist
        if (!fileExistsAtPath(zip_file_path)) {
            cline.recordToolError("pearai_deploy_webapp")
            pushToolResult(formatResponse.toolError(`Zip file not found at path: ${getReadablePath(zip_file_path)}`))
            return
        }

        if (!fileExistsAtPath(env_file_path)) {
            cline.recordToolError("pearai_deploy_webapp")
            pushToolResult(formatResponse.toolError(`Environment file not found at path: ${getReadablePath(env_file_path)}`))
            return
        }

        cline.consecutiveMistakeCount = 0

        const toolMessage = JSON.stringify({
            tool: "pearai_deploy_webapp",
            zip_file_path,
            env_file_path,
            site_id,
            isStatic,
        })

        const didApprove = await askApproval("tool", toolMessage)

        if (!didApprove) {
            return
        }

        // TODO: Implement actual deployment logic here
        // For now, just simulate a successful deployment
        pushToolResult(
            formatResponse.toolResult(
                `Successfully deployed webapp${site_id ? ` to site ${site_id}` : " (new site)"}${isStatic ? " (static deployment)" : ""}`
            )
        )

        return
    } catch (error) {
        await handleError("deploying webapp", error)
        return
    }
} 