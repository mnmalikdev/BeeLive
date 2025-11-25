import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		external: ['vaul-svelte']
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					// Vendor chunks for better caching
					'svelte-vendor': ['svelte', 'svelte/internal'],
					'ui-components': [
						'bits-ui',
						'@tabler/icons-svelte',
						'@lucide/svelte'
					],
					'gauge': ['svelte-gauge']
				}
			}
		},
		// Optimize chunk size
		chunkSizeWarningLimit: 600,
		// Enable minification
		minify: 'esbuild',
		// Enable source maps for debugging (disable in production if needed)
		sourcemap: false
	},
	optimizeDeps: {
		include: ['svelte-gauge', 'bits-ui'],
		exclude: []
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
