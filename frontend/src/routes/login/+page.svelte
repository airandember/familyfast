<script lang="ts">
	import { auth, isAuthLoading } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';
	let error = '';

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		try {
			await auth.login({ email, password });
			goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login failed';
		}
	}

	function loginWithGoogle() {
		const apiUrl = import.meta.env.VITE_API_URL || '';
		window.location.href = `${apiUrl}/api/auth/google`;
	}
</script>

<svelte:head>
	<title>Login - FamilyFast</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
	<div class="w-full max-w-md">
		<div class="card">
			<div class="text-center mb-8">
				<h1 class="font-display text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
				<p class="text-gray-600">Sign in to your FamilyFast account</p>
			</div>

			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
					{error}
				</div>
			{/if}

			<form on:submit={handleSubmit} class="space-y-5">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						class="input"
						placeholder="you@example.com"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						class="input"
						placeholder="Enter your password"
						required
					/>
				</div>

				<div class="flex items-center justify-between">
					<label class="flex items-center gap-2">
						<input type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
						<span class="text-sm text-gray-600">Remember me</span>
					</label>
					<a href="/forgot-password" class="text-sm text-primary-600 hover:text-primary-700">
						Forgot password?
					</a>
				</div>

				<button type="submit" class="btn-primary w-full py-3" disabled={$isAuthLoading}>
					{#if $isAuthLoading}
						<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Signing in...
					{:else}
						Sign in
					{/if}
				</button>
			</form>

			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-200"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-white px-4 text-gray-500">Or continue with</span>
				</div>
			</div>

			<button
				on:click={loginWithGoogle}
				class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				<span class="font-medium text-gray-700">Google</span>
			</button>

			<p class="mt-8 text-center text-gray-600">
				Don't have an account?
				<a href="/register" class="text-primary-600 hover:text-primary-700 font-medium">Sign up</a>
			</p>
		</div>
	</div>
</div>
