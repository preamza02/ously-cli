import process from 'node:process'

import { PKG_VERSION } from './meta.ts'

export const SCHEMA_VERSION = '1.0.0' as const

export type OutputMeta = {
	version: string
	durationMs: number
	[key: string]: unknown
}

export type OkEnvelope<T> = {
	ok: true
	schemaVersion: typeof SCHEMA_VERSION
	command: string
	data: T
	meta: OutputMeta
}

export type ErrorPayload = {
	code: string
	message: string
	details?: unknown
	hint?: string
	docs?: string
}

export type FailEnvelope = {
	ok: false
	schemaVersion: typeof SCHEMA_VERSION
	command: string
	error: ErrorPayload
	meta: OutputMeta
}

export type Envelope<T> = OkEnvelope<T> | FailEnvelope

const t0 = process.hrtime.bigint()

export function nowMs(): number {
	const ns = process.hrtime.bigint() - t0
	return Number(ns / 1_000_000n)
}

function write(line: string): void {
	process.stdout.write(line.endsWith('\n') ? line : `${line}\n`)
}

export function ok<T>(
	command: string,
	data: T,
	extraMeta: Record<string, unknown> = {}
): OkEnvelope<T> {
	const envelope: OkEnvelope<T> = {
		ok: true,
		schemaVersion: SCHEMA_VERSION,
		command,
		data,
		meta: { version: PKG_VERSION, durationMs: nowMs(), ...extraMeta },
	}
	write(JSON.stringify(envelope))
	return envelope
}

export function fail(
	command: string,
	error: ErrorPayload,
	extraMeta: Record<string, unknown> = {}
): FailEnvelope {
	const envelope: FailEnvelope = {
		ok: false,
		schemaVersion: SCHEMA_VERSION,
		command,
		error,
		meta: { version: PKG_VERSION, durationMs: nowMs(), ...extraMeta },
	}
	write(JSON.stringify(envelope))
	return envelope
}

export function plan<T>(
	command: string,
	data: T,
	extraMeta: Record<string, unknown> = {}
): OkEnvelope<T> {
	return ok(command, data, { ...extraMeta, plan: true })
}
