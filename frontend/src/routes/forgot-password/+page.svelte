<script lang="ts">
	import { api } from '$lib/api/client';

	let email = '';
	let submitted = false;
	let loading = false;
	let error = '';

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			await api.post('/api/auth/forgot-password', { email }, { skipAuth: true });
			submitted = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - FamilyFast</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
	<div class="w-full max-w-md">
		<div class="card">
			{#if submitted}
				<div class="text-center">
					<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>
					<h1 class="font-display text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
					<p class="text-gray-600 mb-6">
						If an account exists for {email}, we've sent password reset instructions.
					</p>
					<a href="/login" class="btn-primary">
						Back to Login
					</a>
				</div>
			{:else}
				<div class="text-center mb-8">
					<h1 class="font-display text-3xl font-bold text-gray-900 mb-2">Forgot password?</h1>
					<p class="text-gray-600">No worries, we'll send you reset instructions.</p>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
						{error}
					</div>
				{/if}

				<form on:submit|preventDefault={handleSubmit} class="space-y-5">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							class="input"
							placeholder="Enter your email"
							required
						/>
					</div>

					<button type="submit" class="btn-primary w-full py-3" disabled={loading}>
						{#if loading}
							<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Sending...
						{:else}
							Reset password
						{/if}
					</button>
				</form>

				<p class="mt-8 text-center text-gray-600">
					<a href="/login" class="text-primary-600 hover:text-primary-700 font-medium">
						← Back to login
					</a>
				</p>
			{/if}
		</div>
	</div>
</div>
