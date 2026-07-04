import process from 'node:process'

import { runMain } from 'citty'

import { rootCommand } from './commands/_registry.ts'
import { AppError, ErrorCode, exitCodeFor, toAppError } from './core/errors.ts'
import { logger, parseLogLevel } from './core/logger.ts'
import { fail } from './core/output.ts'

const lvl = parseLogLevel(process.env.OUSLY_LOG)
if (lvl) logger.setLevel(lvl)

const HELP_FLAGS = new Set(['--help', '-h'])
const VERSION_FLAGS = new Set(['--version', '-V'])

function hasHelpFlag(argv: readonly string[]): boolean {
	return argv.some((a) => HELP_FLAGS.has(a))
}

function hasVersionFlag(argv: readonly string[]): boolean {
	return argv.some((a) => VERSION_FLAGS.has(a))
}

function knownSubcommands(): Set<string> {
	return new Set(Object.keys(rootCommand.subCommands ?? {}))
}

function validateSubcommand(argv: readonly string[]): AppError | null {
	const first = argv[0]
	if (!first) return null
	if (first.startsWith('-')) return null
	if (knownSubcommands().has(first)) return null
	return new AppError({
		code: ErrorCode.Usage,
		message: `Unknown command: ${first}`,
		details: { known: [...knownSubcommands()] },
		hint: `Run 'ously --help' to see available commands.`,
	})
}

async function main(): Promise<void> {
	const argv = process.argv.slice(2)

	if (hasHelpFlag(argv) && argv.length === 1) {
		const helpRes = await runMain(rootCommand as never, { rawArgs: ['--help'] })
		return helpRes
	}

	if (hasVersionFlag(argv) && argv.length === 1) {
		process.stdout.write('0.0.0\n')
		return
	}

	const validation = validateSubcommand(argv)
	if (validation) {
		fail(argv[0] ?? 'root', validation.toPayload())
		process.exit(exitCodeFor(validation.code))
	}

	try {
		await runMain(rootCommand as never, { rawArgs: argv })
	} catch (err: unknown) {
		const appErr = toAppError(err)
		const command = argv[0] ?? 'root'
		fail(command, appErr.toPayload())
		process.exit(exitCodeFor(appErr.code))
	}
}

process.on('uncaughtException', (err) => {
	logger.error('uncaughtException', { name: err.name, message: err.message })
	const appErr = toAppError(err)
	fail('uncaught', appErr.toPayload())
	process.exit(exitCodeFor(appErr.code))
})

process.on('unhandledRejection', (reason) => {
	logger.error('unhandledRejection', { reason: String(reason) })
	const appErr =
		reason instanceof AppError
			? reason
			: new AppError({ code: ErrorCode.Internal, message: 'Unhandled promise rejection' })
	fail('uncaught', appErr.toPayload())
	process.exit(exitCodeFor(appErr.code))
})

await main()
