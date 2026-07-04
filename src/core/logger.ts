import process from 'node:process'

const LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const
export type LogLevel = (typeof LEVELS)[number]

let minLevel: LogLevel = process.env.OUSLY_LOG === 'silent' ? 'silent' : 'info'

const rank: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 }

function shouldLog(level: LogLevel): boolean {
	return rank[level] >= rank[minLevel]
}

function emit(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
	if (!shouldLog(level)) return
	const line = {
		t: new Date().toISOString(),
		level,
		msg,
		...(fields ?? {}),
	}
	process.stderr.write(`${JSON.stringify(line)}\n`)
}

export const logger = {
	debug(msg: string, fields?: Record<string, unknown>): void {
		emit('debug', msg, fields)
	},
	info(msg: string, fields?: Record<string, unknown>): void {
		emit('info', msg, fields)
	},
	warn(msg: string, fields?: Record<string, unknown>): void {
		emit('warn', msg, fields)
	},
	error(msg: string, fields?: Record<string, unknown>): void {
		emit('error', msg, fields)
	},
	setLevel(level: LogLevel): void {
		minLevel = level
	},
}

export function parseLogLevel(value: string | undefined): LogLevel | undefined {
	if (!value) return undefined
	const v = value.toLowerCase()
	return LEVELS.includes(v as LogLevel) ? (v as LogLevel) : undefined
}
