import { defineConfig } from 'tsup'

export default defineConfig({
	entry: { cli: 'src/cli.ts' },
	outDir: 'dist',
	format: ['esm'],
	outExtension: () => ({ js: '.mjs' }),
	target: 'node22',
	platform: 'node',
	splitting: false,
	minify: true,
	treeshake: true,
	sourcemap: false,
	clean: true,
	dts: false,
	banner: {
		js: "import { createRequire as __crq} from 'node:module'; const require = __crq(import.meta.url);",
	},
	esbuildOptions(options) {
		options.banner = {
			js: `// ously-cli v${process.env.npm_package_version ?? '0.0.0'}`,
		}
		options.legalComments = 'none'
	},
})
