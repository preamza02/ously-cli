import { describe, expect, it } from 'vitest'

import { AppError, ErrorCode, exitCodeFor, toAppError } from '../src/core/errors.ts'

describe('AppError', () => {
	it('toPayload omits undefined optional fields', () => {
		const e = new AppError({ code: ErrorCode.InvalidInput, message: 'bad' })
		const p = e.toPayload()
		expect(p).toEqual({ code: 'E_INVALID_INPUT', message: 'bad' })
		expect(p).not.toHaveProperty('details')
		expect(p).not.toHaveProperty('hint')
		expect(p).not.toHaveProperty('docs')
	})

	it('toPayload includes optional fields when present', () => {
		const e = new AppError({
			code: ErrorCode.NotFound,
			message: 'missing',
			details: { id: 1 },
			hint: 'create it first',
			docs: 'https://example.com/docs',
		})
		expect(e.toPayload()).toEqual({
			code: 'E_NOT_FOUND',
			message: 'missing',
			details: { id: 1 },
			hint: 'create it first',
			docs: 'https://example.com/docs',
		})
	})
})

describe('exitCodeFor', () => {
	it('maps codes to BSD sysexits.h-like codes', () => {
		expect(exitCodeFor(ErrorCode.InvalidInput)).toBe(2)
		expect(exitCodeFor(ErrorCode.NotFound)).toBe(3)
		expect(exitCodeFor(ErrorCode.Conflict)).toBe(4)
		expect(exitCodeFor(ErrorCode.Usage)).toBe(64)
		expect(exitCodeFor(ErrorCode.Unsupported)).toBe(69)
		expect(exitCodeFor(ErrorCode.Internal)).toBe(70)
		expect(exitCodeFor(ErrorCode.Aborted)).toBe(130)
	})
})

describe('toAppError', () => {
	it('returns the same instance when given an AppError', () => {
		const original = new AppError({ code: ErrorCode.Conflict, message: 'x' })
		expect(toAppError(original)).toBe(original)
	})

	it('wraps a plain Error with E_INTERNAL', () => {
		const e = toAppError(new TypeError('nope'))
		expect(e).toBeInstanceOf(AppError)
		expect(e.code).toBe(ErrorCode.Internal)
		expect(e.message).toBe('nope')
	})

	it('wraps a string', () => {
		const e = toAppError('oops')
		expect(e).toBeInstanceOf(AppError)
		expect(e.code).toBe(ErrorCode.Internal)
		expect(e.message).toBe('oops')
	})
})
