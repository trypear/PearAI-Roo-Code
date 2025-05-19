import path from "path"
import fs from "fs/promises"
import { Cline } from "../Cline"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { formatResponse } from "../prompts/responses"
import { getReadablePath } from "../../utils/path"
import { isPathOutsideWorkspace } from "../../utils/pathUtils"
import { fileExistsAtPath } from "../../utils/fs"
import FormData from "form-data"
import fetch from "node-fetch"
import * as vscode from "vscode"

const SERVER_URL = "https://server.trypear.ai/pearai-server-api2"

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

        // Read files
        const zipContent = await fs.readFile(zip_file_path)
        const envContent = await fs.readFile(env_file_path)

        // Prepare form data
        const form = new FormData()
        form.append("zip_file", zipContent, {
            filename: "dist.zip",
            contentType: "application/zip",
        })
        form.append("env_file", envContent, {
            filename: ".env",
            contentType: "text/plain",
        })
        if (site_id) {
            form.append("site_id", site_id)
        }
        if (isStatic) {
            form.append("static", "true")
        }

        // Get auth token from extension context
        const authToken = await vscode.commands.executeCommand("pearai-roo-cline.getPearAIApiKey")
        if (!authToken) {
            vscode.commands.executeCommand("pearai-roo-cline.PearAIKeysNotFound", undefined)
            vscode.window.showErrorMessage("PearAI API key not found.", "Login to PearAI").then(async (selection) => {
                if (selection === "Login to PearAI") {
                    const extensionUrl = `${vscode.env.uriScheme}://pearai.pearai/auth`
                    const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(extensionUrl))
                    vscode.env.openExternal(
                        await vscode.env.asExternalUri(
                            vscode.Uri.parse(`https://trypear.ai/signin?callback=${callbackUri.toString()}`),
                        ),
                    )
                }
            })
            throw new Error("PearAI API key not found. Please login to PearAI.")
        }

        // Make POST request to deployment endpoint
        const endpoint = site_id ? `${SERVER_URL}/redeploy-netlify` : `${SERVER_URL}/deploy-netlify`
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            body: form,
        })

        if (!response.ok) {
            throw new Error(`Deployment failed with status ${response.status}: ${await response.text()}`)
        }

        const result = await response.text()
        pushToolResult(
            formatResponse.toolResult(
                `Successfully deployed webapp${site_id ? ` to site ${site_id}` : " (new site)"}${isStatic ? " (static deployment)" : ""}\n\n${result}`
            )
        )

        return
    } catch (error) {
        await handleError("deploying webapp", error)
        return
    }
} 