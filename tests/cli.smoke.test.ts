import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..')
const bin = path.join(root, 'bin', 'ously.mjs')
const distCli = path.join(root, 'dist', 'cli.mjs')

function runCli(args: string[]): { status: number; stdout: string; stderr: string } {
	if (!existsSync(distCli)) {
		throw new Error(
			`dist/cli.mjs not found. Run "pnpm build" before this smoke test. (looked at ${distCli})`
		)
	}
	const res = spawnSync(process.execPath, [bin, ...args], {
		encoding: 'utf8',
		cwd: root,
		env: { ...process.env, OUSLY_LOG: 'silent', NO_COLOR: '1' },
	})
	return {
		status: res.status ?? -1,
		stdout: res.stdout ?? '',
		stderr: res.stderr ?? '',
	}
}

describe('smoke: built binary', () => {
	it('exists and is executable via shebang', () => {
		expect(existsSync(bin)).toBe(true)
	})

	it('ously version exits 0 with valid JSON envelope', () => {
		const { status, stdout, stderr } = runCli(['version'])
		expect(stderr).toBe('')
		expect(status).toBe(0)
		const out = stdout.trim()
		const parsed = JSON.parse(out)
		expect(parsed.ok).toBe(true)
		expect(parsed.command).toBe('version')
		expect(parsed.data.version).toMatch(/^\d+\.\d+\.\d+/)
		expect(parsed.data.node).toMatch(/^v\d+/)
		expect(parsed.data.platform).toBeTypeOf('string')
		expect(parsed.data.arch).toBeTypeOf('string')
		expect(parsed.meta.durationMs).toBeTypeOf('number')
	})

	it('ously version --plan returns plan:true in meta', () => {
		const { status, stdout } = runCli(['version', '--plan'])
		expect(status).toBe(0)
		const parsed = JSON.parse(stdout.trim())
		expect(parsed.ok).toBe(true)
		expect(parsed.meta.plan).toBe(true)
		expect(parsed.data.wouldReturn).toBeTypeOf('object')
	})

	it('unknown subcommand fails with ok:false and E_USAGE-like shape', () => {
		const { status, stdout } = runCli(['definitely-not-a-command'])
		const parsed = JSON.parse(stdout.trim())
		expect(parsed.ok).toBe(false)
		expect(typeof parsed.error.code).toBe('string')
		expect(typeof parsed.error.message).toBe('string')
		expect(status).not.toBe(0)
	})
})
