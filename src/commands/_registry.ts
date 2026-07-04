import { defineCommand } from 'citty'

import { versionCommand } from './version.command.ts'

export const rootCommand = defineCommand({
	meta: {
		name: 'ously',
		version: '0.0.0',
		description:
			'Personal financial planning tools designed for AI agents. JSON-in, JSON-out. Never interactive.',
	},
	subCommands: {
		version: versionCommand,
	},
})
