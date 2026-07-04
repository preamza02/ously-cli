import { createRequire } from 'node:module'
import process from 'node:process'

const require = createRequire(import.meta.url)

type PkgShape = {
	name: string
	version: string
}

let cached: PkgShape | null = null

function load(): PkgShape {
	if (cached) return cached
	try {
		const pkg = require('../package.json') as PkgShape
		cached = { name: pkg.name, version: pkg.version }
		return cached
	} catch {
		cached = { name: 'ously-cli', version: '0.0.0' }
		return cached
	}
}

export const PKG_NAME: string = load().name
export const PKG_VERSION: string = load().version

export function nodeInfo(): {
	node: string
	platform: NodeJS.Platform
	arch: string
	pid: number
	ppid: number
	uptimeSec: number
} {
	return {
		node: process.version,
		platform: process.platform,
		arch: process.arch,
		pid: process.pid,
		ppid: process.ppid,
		uptimeSec: Math.round(process.uptime()),
	}
}
