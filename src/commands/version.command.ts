import process from 'node:process'
import { defineCommand } from 'citty'
import * as v from 'valibot'
import { logger } from '../core/logger.ts'
import { nodeInfo, PKG_VERSION } from '../core/meta.ts'
import { ok, plan } from '../core/output.ts'

const Args = v.object({
	plan: v.optional(v.boolean(), false),
})

const Data = v.object({
	name: v.string(),
	version: v.string(),
	schemaVersion: v.string(),
	node: v.string(),
	platform: v.string(),
	arch: v.string(),
})

type DataT = v.InferOutput<typeof Data>

export const versionCommand = defineCommand({
	meta: {
		name: 'version',
		description:
			'Print version, schema, and runtime info as JSON. Supports --plan for a dry-run preview.',
	},
	args: {
		plan: {
			type: 'boolean',
			description: 'Return a non-mutating plan describing what would be returned.',
			default: false,
		},
	},
	async run({ args }) {
		const parsed = v.parse(Args, { plan: args.plan ?? false })
		logger.debug('version command invoked', { plan: parsed.plan })

		const data: DataT = {
			name: 'ously-cli',
			version: PKG_VERSION,
			schemaVersion: '1.0.0',
			...nodeInfo(),
		}

		if (parsed.plan) {
			process.exitCode = 0
			return plan('version', {
				wouldReturn: data,
				notes: ['Pure read command; no side effects.', 'Safe to call before any setup.'],
			})
		}

		process.exitCode = 0
		return ok('version', data)
	},
})
