<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api } from '$lib/api/client';
	import { auth } from '$lib/stores/auth';

	onMount(async () => {
		const accessToken = $page.url.searchParams.get('accessToken');
		const refreshToken = $page.url.searchParams.get('refreshToken');

		if (accessToken && refreshToken) {
			api.setTokens(accessToken, refreshToken);
			await auth.init();
			goto('/dashboard');
		} else {
			goto('/login?error=oauth_failed');
		}
	});
</script>

<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center">
	<div class="text-center">
		<svg class="animate-spin h-12 w-12 text-primary-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
		<p class="text-gray-600">Completing sign in...</p>
	</div>
</div>
