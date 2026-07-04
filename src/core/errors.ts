import type { ErrorPayload } from './output.ts'

export const ErrorCode = {
	InvalidInput: 'E_INVALID_INPUT',
	NotFound: 'E_NOT_FOUND',
	Conflict: 'E_CONFLICT',
	Usage: 'E_USAGE',
	Unsupported: 'E_UNSUPPORTED',
	Internal: 'E_INTERNAL',
	Aborted: 'E_ABORTED',
} as const

export type ErrorCodeT = (typeof ErrorCode)[keyof typeof ErrorCode]

export class AppError extends Error {
	override name = 'AppError'
	readonly code: ErrorCodeT
	readonly details: unknown
	readonly hint: string | undefined
	readonly docs: string | undefined

	constructor(opts: {
		code: ErrorCodeT
		message: string
		details?: unknown
		hint?: string
		docs?: string
	}) {
		super(opts.message)
		this.code = opts.code
		this.details = opts.details
		this.hint = opts.hint
		this.docs = opts.docs
	}

	toPayload(): ErrorPayload {
		const payload: ErrorPayload = { code: this.code, message: this.message }
		if (this.details !== undefined) payload.details = this.details
		if (this.hint) payload.hint = this.hint
		if (this.docs) payload.docs = this.docs
		return payload
	}
}

const exitByCode: Record<ErrorCodeT, number> = {
	[ErrorCode.InvalidInput]: 2,
	[ErrorCode.NotFound]: 3,
	[ErrorCode.Conflict]: 4,
	[ErrorCode.Usage]: 64,
	[ErrorCode.Unsupported]: 69,
	[ErrorCode.Internal]: 70,
	[ErrorCode.Aborted]: 130,
}

export function exitCodeFor(code: ErrorCodeT): number {
	return exitByCode[code]
}

export function toAppError(err: unknown): AppError {
	if (err instanceof AppError) return err
	if (err instanceof Error) {
		return new AppError({
			code: ErrorCode.Internal,
			message: err.message || 'Internal error',
			details: { name: err.name, stack: err.stack?.split('\n').slice(0, 3) },
		})
	}
	return new AppError({ code: ErrorCode.Internal, message: String(err) })
}
