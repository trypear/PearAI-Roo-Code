#!/usr/bin/env node

// These environment variables must be set on top of the file
process.env.WDS_SOCKET_HOST = "localhost"
process.env.WDS_SOCKET_PORT = "3000"
process.env.HOST = "localhost"
process.env.BROWSER = "none" // Disable localhost url opening in browser

const rewire = require("rewire")
const defaults = rewire("react-scripts/scripts/start.js")
const configFactory = defaults.__get__("configFactory")

// Wrap the configFactory to modify its output
defaults.__set__("configFactory", (webpackEnv) => {
	const config = configFactory(webpackEnv)

	const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin")
	const path = require("path")
	const fs = require("fs")

	const sharedDir = path.resolve(__dirname, "..", "..", "src", "shared")

	function getAllFiles(dir) {
		let files = []
		fs.readdirSync(dir).forEach((file) => {
			const filePath = path.join(dir, file)
			if (fs.statSync(filePath).isDirectory()) {
				files = files.concat(getAllFiles(filePath))
			} else {
				const withoutExtension = path.join(dir, path.parse(file).name)
				files.push(withoutExtension)
			}
		})
		return files
	}

	const sharedFiles = getAllFiles(sharedDir)

	config.resolve.plugins.forEach((plugin) => {
		if (plugin instanceof ModuleScopePlugin) {
			console.log("Whitelisting shared files: ", sharedFiles)
			sharedFiles.forEach((file) => plugin.allowedFiles.add(file))
		}
	})

	config.module.rules[1].oneOf.forEach((rule) => {
		if (rule.test && rule.test.toString().includes("ts|tsx")) {
			rule.include = [rule.include, sharedDir].filter(Boolean)
		}
	})

	// Modify webpack dev server settings
	if (config.devServer) {
		config.devServer = {
			...config.devServer,
			host: "localhost",
			port: 3000,
			hot: true,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			allowedHosts: "all",
			client: {
				webSocketURL: {
					hostname: "localhost",
					pathname: "/ws",
					port: 3000,
					protocol: "ws",
				},
			},
		}
	}

	// Force websocket client settings
	if (config.output) {
		config.output = {
			...config.output,
			publicPath: "http://localhost:3000/",
		}
	}

	return config
})
