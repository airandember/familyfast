import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html', // SPA mode for GitHub Pages
			precompress: false,
			strict: true
		}),
		paths: {
			// Set base path for GitHub Pages if needed
			// base: process.env.NODE_ENV === 'production' ? '/familyfast' : ''
		}
	}
};

export default config;
