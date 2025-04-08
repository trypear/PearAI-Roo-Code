import * as fs from "fs"
import * as path from "path"
import * as os from "os"

export interface Memory {
	id: string
	content: string
	timestamp: string
}

export interface APIMemory {
	id: string
	memory: string
	created_at: string
	updated_at: string
	total_memories: number
	owner: string
	organization: string
	metadata: Record<string, any>
	type: string
}

const MEMORIES_FILE = "memories.json"

function convertToAPIMemory(localMemory: Memory): APIMemory {
	return {
		id: localMemory.id,
		memory: localMemory.content,
		created_at: localMemory.timestamp,
		updated_at: localMemory.timestamp,
		total_memories: 1,
		owner: "",
		organization: "",
		metadata: {},
		type: "manual",
	}
}

export function getMemoriesFilePath(): string {
	const pearaiPath = process.env.CONTINUE_GLOBAL_DIR ?? path.join(os.homedir(), ".pearai")
	return path.join(pearaiPath, MEMORIES_FILE)
}

export function initializeMemoriesFile(): void {
	const filePath = getMemoriesFilePath()
	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, JSON.stringify([], null, 2))
	}
}

export function readMemories(): APIMemory[] {
	try {
		initializeMemoriesFile()
		const content = fs.readFileSync(getMemoriesFilePath(), "utf8")
		const localMemories = JSON.parse(content) as Memory[]
		return localMemories.map(convertToAPIMemory)
	} catch (error) {
		console.error("Error reading memories:", error)
		return []
	}
}
