<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth, user, isAuthenticated } from '$lib/stores/auth';
	import { families, familiesList, isFamiliesLoading } from '$lib/stores/families';
	import { getMonogram, getFamilyColorClasses } from '$lib/utils';

	let showCreateModal = false;
	let showJoinModal = false;
	let newFamilyName = '';
	let newFamilyDescription = '';
	let inviteCode = '';
	let error = '';

	onMount(async () => {
		// Wait for auth to initialize
		const unsubscribe = auth.subscribe(async (state) => {
			if (state.initialized && !state.user) {
				goto('/login');
				unsubscribe();
			} else if (state.initialized && state.user) {
				await families.loadFamilies();
				unsubscribe();
			}
		});
	});

	async function createFamily() {
		error = '';
		try {
			await families.createFamily({ name: newFamilyName, description: newFamilyDescription || undefined });
			showCreateModal = false;
			newFamilyName = '';
			newFamilyDescription = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create family';
		}
	}

	async function joinFamily() {
		error = '';
		try {
			await families.joinFamily(inviteCode);
			showJoinModal = false;
			inviteCode = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to join family';
		}
	}
</script>

<svelte:head>
	<title>Dashboard - FamilyFast</title>
</svelte:head>

{#if $isAuthenticated}
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Welcome Header -->
		<div class="mb-8">
			<h1 class="font-display text-3xl font-bold text-gray-900">
				Welcome back, {$user?.name?.split(' ')[0]}!
			</h1>
			<p class="text-gray-600 mt-1">Here's what's happening with your families</p>
		</div>

		<!-- Quick Stats -->
		<div class="grid md:grid-cols-3 gap-6 mb-8">
			<div class="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-primary-100 text-sm font-medium">Families</p>
						<p class="text-3xl font-bold">{$familiesList.length}</p>
					</div>
					<div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
				</div>
			</div>

			<div class="card bg-gradient-to-br from-secondary-500 to-secondary-600 text-white">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-secondary-100 text-sm font-medium">Family Members</p>
						<p class="text-3xl font-bold">
							{$familiesList.reduce((sum, f) => sum + (f.memberCount || 0), 0)}
						</p>
					</div>
					<div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
						</svg>
					</div>
				</div>
			</div>

			<div class="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-accent-100 text-sm font-medium">Coming Soon</p>
						<p class="text-lg font-bold">Challenges</p>
					</div>
					<div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
						</svg>
					</div>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex flex-wrap gap-4 mb-8">
			<button on:click={() => (showCreateModal = true)} class="btn-primary">
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Create Family
			</button>
			<button on:click={() => (showJoinModal = true)} class="btn-outline">
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
				</svg>
				Join Family
			</button>
		</div>

		<!-- Families List -->
		<div>
			<h2 class="font-display text-xl font-bold text-gray-900 mb-4">Your Families</h2>

			{#if $isFamiliesLoading}
				<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each [1, 2, 3] as _}
						<div class="card animate-pulse">
							<div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
							<div class="h-4 bg-gray-200 rounded w-1/2"></div>
						</div>
					{/each}
				</div>
			{:else if $familiesList.length === 0}
				<div class="card text-center py-12">
					<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No families yet</h3>
					<p class="text-gray-600 mb-6">Create a new family or join an existing one to get started</p>
					<div class="flex justify-center gap-4">
						<button on:click={() => (showCreateModal = true)} class="btn-primary">
							Create Family
						</button>
						<button on:click={() => (showJoinModal = true)} class="btn-outline">
							Join Family
						</button>
					</div>
				</div>
			{:else}
				<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each $familiesList as family}
						{@const colors = getFamilyColorClasses(family.color || 'orange')}
						<a href="/families/{family.id}" class="card-hover block group">
							<div class="flex items-start justify-between mb-4">
								<div class="w-12 h-12 rounded-xl bg-gradient-to-br {colors.light} flex items-center justify-center">
									{#if family.emoji}
										<span class="text-2xl">{family.emoji}</span>
									{:else}
										<span class="{colors.text} font-bold text-lg">
											{getMonogram(family.name)}
										</span>
									{/if}
								</div>
								<svg class="w-5 h-5 text-gray-400 group-hover:{colors.text} transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</div>
							<h3 class="font-display text-lg font-bold text-gray-900 mb-1">{family.name}</h3>
							{#if family.description}
								<p class="text-gray-600 text-sm mb-3 line-clamp-2">{family.description}</p>
							{/if}
							<div class="flex items-center gap-2 text-sm text-gray-500">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
								{family.memberCount || 0} members
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Create Family Modal -->
	{#if showCreateModal}
		<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div class="card w-full max-w-md">
				<h2 class="font-display text-2xl font-bold text-gray-900 mb-6">Create a Family</h2>
				
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
						{error}
					</div>
				{/if}

				<form on:submit|preventDefault={createFamily} class="space-y-4">
					<div>
						<label for="familyName" class="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
						<input
							type="text"
							id="familyName"
							bind:value={newFamilyName}
							class="input"
							placeholder="e.g., The Smiths"
							required
						/>
					</div>

					<div>
						<label for="familyDesc" class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
						<textarea
							id="familyDesc"
							bind:value={newFamilyDescription}
							class="input"
							rows="3"
							placeholder="A brief description of your family group"
						></textarea>
					</div>

					<div class="flex gap-3 pt-4">
						<button type="button" on:click={() => (showCreateModal = false)} class="btn-ghost flex-1">
							Cancel
						</button>
						<button type="submit" class="btn-primary flex-1">
							Create Family
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Join Family Modal -->
	{#if showJoinModal}
		<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div class="card w-full max-w-md">
				<h2 class="font-display text-2xl font-bold text-gray-900 mb-6">Join a Family</h2>
				
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
						{error}
					</div>
				{/if}

				<form on:submit|preventDefault={joinFamily} class="space-y-4">
					<div>
						<label for="inviteCode" class="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
						<input
							type="text"
							id="inviteCode"
							bind:value={inviteCode}
							class="input"
							placeholder="Enter the invite code"
							required
						/>
						<p class="mt-2 text-sm text-gray-500">
							Ask a family admin for the invite code to join their family
						</p>
					</div>

					<div class="flex gap-3 pt-4">
						<button type="button" on:click={() => (showJoinModal = false)} class="btn-ghost flex-1">
							Cancel
						</button>
						<button type="submit" class="btn-primary flex-1">
							Join Family
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
{/if}
