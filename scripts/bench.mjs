#!/usr/bin/env node
// Cold-start benchmark. Run: pnpm bench
// Measures time-to-stdout for the built binary over N runs.

import { spawnSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import process from 'node:process'

const root = path.resolve(import.meta.dirname, '..')
const bin = path.join(root, 'bin', 'ously.mjs')
const dist = path.join(root, 'dist', 'cli.mjs')
const N = Number(process.env.BENCH_N ?? 50)

if (!existsSync(dist)) {
	console.error(`dist/cli.mjs not found. Run "pnpm build" first.`)
	process.exit(1)
}

const distSize = statSync(dist).size
console.log(`dist/cli.mjs size: ${distSize} bytes (${(distSize / 1024).toFixed(1)} KB)`)
console.log(`running ${N} cold-start samples...`)

const samples = []

for (let i = 0; i < N; i++) {
	const start = performance.now()
	const res = spawnSync(process.execPath, [bin, 'version'], {
		encoding: 'utf8',
		cwd: root,
		env: { ...process.env, OUSLY_LOG: 'silent', NO_COLOR: '1' },
	})
	const end = performance.now()
	const wall = end - start
	if (res.status !== 0) {
		console.error(`run ${i} failed:`, res.stderr)
		process.exit(1)
	}
	samples.push(wall)
}

samples.sort((a, b) => a - b)
const sum = samples.reduce((a, b) => a + b, 0)
const mean = sum / samples.length
const min = samples[0] ?? 0
const max = samples[samples.length - 1] ?? 0
const p50 = samples[Math.floor(samples.length * 0.5)] ?? 0
const p90 = samples[Math.floor(samples.length * 0.9)] ?? 0
const p99 = samples[Math.floor(samples.length * 0.99)] ?? 0

const fmt = (n) => `${n.toFixed(2).padStart(7)} ms`

console.log('\n--- cold-start (wall time, includes node startup) ---')
console.log(`  min:  ${fmt(min)}`)
console.log(`  p50:  ${fmt(p50)}`)
console.log(`  mean: ${fmt(mean)}`)
console.log(`  p90:  ${fmt(p90)}`)
console.log(`  p99:  ${fmt(p99)}`)
console.log(`  max:  ${fmt(max)}`)
console.log(`  runs: ${N}`)
