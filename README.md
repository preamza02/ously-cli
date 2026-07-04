# ously-cli

Personal financial planning tools designed for AI agents. **JSON-in, JSON-out. Never interactive.**

[![CI](https://github.com/anomalyco/ously-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/anomalyco/ously-cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/ously-cli)](https://www.npmjs.com/package/ously-cli)
[![license](https://img.shields.io/npm/l/ously-cli)](./LICENSE)

> **Status: v0.0.0 scaffold.** The framework is in place; feature commands are coming.

## Why

This CLI is built for AI agents and automation — not humans at a TTY. Every command:

- Accepts input via flags or JSON on stdin
- Writes **one JSON object** to stdout
- Writes **logs to stderr only**
- Returns a **stable exit code** mapped to the error
- Exposes a `--plan` flag for a non-mutating preview of what the command would do

## Install

```bash
# Recommended: run with npx (no install)
npx ously-cli version

# Or install globally
npm i -g ously-cli
# or
pnpm add -g ously-cli
```

## Usage

```bash
# Show version + runtime info
ously version

# Dry-run preview
ously version --plan

# Help
ously --help
```

## The output contract

Every command writes exactly one JSON object to stdout, followed by a newline. Logs go to stderr.

### Success envelope

```json
{
  "ok": true,
  "schemaVersion": "1.0.0",
  "command": "version",
  "data": {
    "name": "ously-cli",
    "version": "0.0.0",
    "schemaVersion": "1.0.0",
    "node": "v22.0.0",
    "platform": "linux",
    "arch": "x64"
  },
  "meta": {
    "version": "0.0.0",
    "durationMs": 12
  }
}
```

### Error envelope

```json
{
  "ok": false,
  "schemaVersion": "1.0.0",
  "command": "version",
  "error": {
    "code": "E_INVALID_INPUT",
    "message": "income must be > 0",
    "details": { "path": ["income"] }
  },
  "meta": {
    "version": "0.0.0",
    "durationMs": 1
  }
}
```

### Error codes & exit codes

| Code | Meaning | Exit |
|---|---|---|
| `E_INVALID_INPUT` | Input failed schema validation | `2` |
| `E_NOT_FOUND` | Referenced resource missing | `3` |
| `E_CONFLICT` | Resource state conflict | `4` |
| `E_USAGE` | Bad CLI usage (unknown flag, etc.) | `64` |
| `E_UNSUPPORTED` | Operation not supported on this platform/runtime | `69` |
| `E_INTERNAL` | Unhandled internal error | `70` |
| `E_ABORTED` | Operation aborted by user/signal | `130` |

Exit codes mirror [BSD sysexits.h](https://man.openbsd.org/sysexits).

## Environment variables

| Var | Effect |
|---|---|
| `OUSLY_LOG` | Log level for stderr: `debug` \| `info` \| `warn` \| `error` \| `silent`. Default: `info`. |
| `NO_COLOR` | Reserved for future use. |

## Design principles

1. **Zero prompts.** Agents must never be blocked by an interactive prompt.
2. **Determinism.** Given the same input, the same output (modulo time/meta fields).
3. **One JSON object to stdout.** Always parseable in one shot. No streaming, no NDJSON (yet).
4. **Stable schema.** The `schemaVersion` field lets agents pin to a contract.
5. **Lazy commands.** Subcommands are loaded only when invoked, for fast cold start.
6. **Smallest possible install.** Two runtime deps (`citty`, `valibot`). Target: <100 KB tarball.

## Performance budget

| Metric | Target |
|---|---|
| Cold start (p50) | < 50 ms on Node 22, Linux |
| Tarball size | < 100 KB |
| Unpacked `dist/` | < 50 KB |
| RSS at startup | < 40 MB |

Tracked by `scripts/bench.mjs` and CI.

## Development

```bash
# Install
pnpm install

# Lint
pnpm lint

# Typecheck
pnpm typecheck

# Tests (unit)
pnpm test

# Build
pnpm build

# Run the built binary
pnpm start -- version

# Cold-start benchmark
pnpm bench
```

## Project layout

```
src/
  cli.ts                  # entry, error fence
  commands/
    _registry.ts          # lazy command tree
    version.command.ts    # example command
  core/
    output.ts             # JSON envelope helpers
    errors.ts             # AppError + exit codes
    logger.ts             # stderr structured logger
    meta.ts               # version + runtime info
bin/ously.mjs             # shebang → dist/cli.mjs
tests/                    # vitest specs
scripts/bench.mjs         # cold-start benchmark
```

## Roadmap

- **Phase 1** — `npx` distribution via npm. ✅
- **Phase 2** — Standalone binaries (Bun `compile`) for Linux, macOS, Windows.
- **Phase 3** — Homebrew, Scoop, AUR formulae.
- **Feature commands** — `budget`, `goals`, `net-worth`. TBD based on usage.
- **MCP server mode** — expose the same commands as Model Context Protocol tools.

## License

MIT © 2026 Prame Supakone
