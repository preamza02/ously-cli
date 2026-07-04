import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { fail, ok, plan, SCHEMA_VERSION } from '../src/core/output.ts'

type Writable = NodeJS.WritableStream & {
	written: string[]
	write(chunk: string | Uint8Array): boolean
}

function captureStdout(): Writable {
	const written: string[] = []
	const stream = {
		written,
		write(chunk: string | Uint8Array) {
			written.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'))
			return true
		},
	} as Writable
	process.stdout.write = stream.write.bind(stream)
	return stream
}

function restoreStdout(original: typeof process.stdout.write): void {
	process.stdout.write = original
}

describe('output envelope', () => {
	let originalWrite: typeof process.stdout.write
	let stream: Writable

	beforeEach(() => {
		originalWrite = process.stdout.write
		stream = captureStdout()
	})

	afterEach(() => {
		restoreStdout(originalWrite)
	})

	it('ok() writes a single JSON line with all required keys', () => {
		ok('test.cmd', { hello: 'world' }, { foo: 1 })
		expect(stream.written).toHaveLength(1)
		const line = stream.written[0] ?? ''
		expect(line.endsWith('\n')).toBe(true)
		const parsed = JSON.parse(line.trim())
		expect(parsed.ok).toBe(true)
		expect(parsed.schemaVersion).toBe(SCHEMA_VERSION)
		expect(parsed.command).toBe('test.cmd')
		expect(parsed.data).toEqual({ hello: 'world' })
		expect(parsed.meta.version).toBeTypeOf('string')
		expect(parsed.meta.durationMs).toBeTypeOf('number')
		expect(parsed.meta.foo).toBe(1)
	})

	it('fail() writes an envelope with ok:false and error payload', () => {
		fail('test.cmd', { code: 'E_TEST', message: 'boom', details: { a: 1 } })
		expect(stream.written).toHaveLength(1)
		const parsed = JSON.parse((stream.written[0] ?? '').trim())
		expect(parsed.ok).toBe(false)
		expect(parsed.error.code).toBe('E_TEST')
		expect(parsed.error.message).toBe('boom')
		expect(parsed.error.details).toEqual({ a: 1 })
	})

	it('plan() adds plan:true to meta', () => {
		plan('test.cmd', { wouldDo: ['x'] })
		const parsed = JSON.parse((stream.written[0] ?? '').trim())
		expect(parsed.ok).toBe(true)
		expect(parsed.meta.plan).toBe(true)
		expect(parsed.data).toEqual({ wouldDo: ['x'] })
	})
})
