<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth, isAuthenticated, user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let menuOpen = false;

	onMount(() => {
		auth.init();
	});

	async function handleLogout() {
		await auth.logout();
		goto('/');
	}

	$: isHome = $page.url.pathname === '/';
</script>

<div class="min-h-screen flex flex-col">
	<!-- Navigation -->
	<nav class="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<!-- Logo -->
				<a href="/" class="flex items-center gap-2">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
						<span class="text-white font-bold text-xl">F</span>
					</div>
					<span class="font-display font-bold text-xl text-gray-900">FamilyFast</span>
				</a>

				<!-- Desktop Nav -->
				<div class="hidden md:flex items-center gap-6">
					{#if $isAuthenticated}
						<a href="/dashboard" class="text-gray-600 hover:text-gray-900 font-medium">Dashboard</a>
						<a href="/families" class="text-gray-600 hover:text-gray-900 font-medium">Families</a>
						<div class="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
							<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
								<span class="text-primary-600 font-medium text-sm">
									{$user?.name?.charAt(0).toUpperCase()}
								</span>
							</div>
							<span class="text-gray-700 font-medium">{$user?.name}</span>
							<button on:click={handleLogout} class="btn-ghost text-sm">
								Logout
							</button>
						</div>
					{:else}
						<a href="/login" class="btn-ghost">Login</a>
						<a href="/register" class="btn-primary">Get Started</a>
					{/if}
				</div>

				<!-- Mobile menu button -->
				<button
					class="md:hidden p-2 rounded-lg hover:bg-gray-100"
					on:click={() => (menuOpen = !menuOpen)}
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if menuOpen}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						{/if}
					</svg>
				</button>
			</div>

			<!-- Mobile Nav -->
			{#if menuOpen}
				<div class="md:hidden py-4 border-t border-gray-100">
					{#if $isAuthenticated}
						<a href="/dashboard" class="block py-2 text-gray-600">Dashboard</a>
						<a href="/families" class="block py-2 text-gray-600">Families</a>
						<button on:click={handleLogout} class="block py-2 text-gray-600">Logout</button>
					{:else}
						<a href="/login" class="block py-2 text-gray-600">Login</a>
						<a href="/register" class="block py-2 text-primary-600 font-medium">Get Started</a>
					{/if}
				</div>
			{/if}
		</div>
	</nav>

	<!-- Main content -->
	<main class="flex-1">
		<slot />
	</main>

	<!-- Footer -->
	{#if isHome}
		<footer class="bg-gray-900 text-gray-400 py-12">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex flex-col md:flex-row justify-between items-center gap-4">
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
							<span class="text-white font-bold">F</span>
						</div>
						<span class="font-display font-bold text-white">FamilyFast</span>
					</div>
					<p class="text-sm">Bringing families closer together, one moment at a time.</p>
				</div>
			</div>
		</footer>
	{/if}
</div>
