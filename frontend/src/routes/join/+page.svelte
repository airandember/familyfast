<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/auth';
	import { families } from '$lib/stores/families';

	let code = '';
	let error = '';
	let loading = false;

	onMount(() => {
		const urlCode = $page.url.searchParams.get('code');
		if (urlCode) {
			code = urlCode;
			// Auto-join if authenticated
			if ($isAuthenticated) {
				joinFamily();
			}
		}
	});

	async function joinFamily() {
		if (!code.trim()) {
			error = 'Please enter an invite code';
			return;
		}

		if (!$isAuthenticated) {
			// Redirect to login with return URL
			goto(`/login?redirect=/join?code=${code}`);
			return;
		}

		loading = true;
		error = '';

		try {
			const family = await families.joinFamily(code);
			goto(`/families/${family.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to join family';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Join Family - FamilyFast</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
	<div class="w-full max-w-md">
		<div class="card text-center">
			<div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
				<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
				</svg>
			</div>

			<h1 class="font-display text-2xl font-bold text-gray-900 mb-2">Join a Family</h1>
			<p class="text-gray-600 mb-8">Enter the invite code to join a family group</p>

			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-left">
					{error}
				</div>
			{/if}

			<form on:submit|preventDefault={joinFamily} class="space-y-6">
				<div>
					<input
						type="text"
						bind:value={code}
						class="input text-center text-lg tracking-wider"
						placeholder="Enter invite code"
						required
					/>
				</div>

				<button type="submit" class="btn-primary w-full py-3" disabled={loading}>
					{#if loading}
						<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Joining...
					{:else if $isAuthenticated}
						Join Family
					{:else}
						Sign in to Join
					{/if}
				</button>
			</form>

			{#if !$isAuthenticated}
				<p class="mt-6 text-sm text-gray-600">
					Don't have an account? <a href="/register" class="text-primary-600 hover:text-primary-700 font-medium">Sign up first</a>
				</p>
			{/if}
		</div>
	</div>
</div>
