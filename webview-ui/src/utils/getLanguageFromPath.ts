const extensionToLanguage: { [key: string]: string } = {
	// Web technologies
	html: "html",
	htm: "html",
	css: "css",
	js: "javascript",
	jsx: "jsx",
	ts: "typescript",
	tsx: "tsx",

	// Backend languages
	py: "python",
	rb: "ruby",
	php: "php",
	java: "java",
	cs: "csharp",
	go: "go",
	rs: "rust",
	scala: "scala",
	kt: "kotlin",
	swift: "swift",

	// Markup and data
	json: "json",
	xml: "xml",
	yaml: "yaml",
	yml: "yaml",
	md: "markdown",
	csv: "csv",

	// Shell and scripting
	sh: "bash",
	bash: "bash",
	zsh: "bash",
	ps1: "powershell",

	// Configuration
	toml: "toml",
	ini: "ini",
	cfg: "ini",
	conf: "ini",

	// Other
	sql: "sql",
	graphql: "graphql",
	gql: "graphql",
	tex: "latex",
	svg: "svg",
	txt: "text",

	// C-family languages
	c: "c",
	cpp: "cpp",
	h: "c",
	hpp: "cpp",

	// Functional languages
	hs: "haskell",
	lhs: "haskell",
	elm: "elm",
	clj: "clojure",
	cljs: "clojure",
	erl: "erlang",
	ex: "elixir",
	exs: "elixir",

	// Mobile development
	dart: "dart",
	m: "objectivec",
	mm: "objectivec",

	// Game development
	lua: "lua",
	gd: "gdscript", // Godot
	unity: "csharp", // Unity (using C#)

	// Data science and ML
	r: "r",
	jl: "julia",
	ipynb: "jupyter", // Jupyter notebooks
}

// Example usage:
// console.log(getLanguageFromPath('/path/to/file.js')); // Output: javascript

export function getLanguageFromPath(filePath: string): string {
	const extension = filePath.split(".").pop()?.toLowerCase() || ""

	// Map file extensions to languages
	const languageMap: { [key: string]: string } = {
		js: "javascript",
		jsx: "javascript",
		ts: "typescript",
		tsx: "typescript",
		py: "python",
		java: "java",
		cpp: "cpp",
		c: "c",
		cs: "csharp",
		go: "go",
		rs: "rust",
		rb: "ruby",
		php: "php",
		swift: "swift",
		kt: "kotlin",
		scala: "scala",
		md: "markdown",
		json: "json",
		yaml: "yaml",
		yml: "yaml",
		xml: "xml",
		html: "html",
		css: "css",
		scss: "scss",
		sql: "sql",
		sh: "shell",
		bash: "shell",
		zsh: "shell",
		dockerfile: "dockerfile",
		vue: "vue",
		svelte: "svelte",
		graphql: "graphql",
		proto: "protobuf",
	}

	return languageMap[extension] || extension || "plaintext"
}

export function normalizePath(path: string): string {
	// Convert Windows backslashes to forward slashes
	let normalized = path.replace(/\\/g, "/")

	// Remove any drive letter prefix (e.g., C:)
	normalized = normalized.replace(/^[A-Za-z]:/, "")

	// Remove any leading slashes
	normalized = normalized.replace(/^\/+/, "")

	// Remove any double slashes
	normalized = normalized.replace(/\/+/g, "/")

	return normalized
}
