<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user, isAuthenticated } from '$lib/stores/auth';
	import { families, currentFamily, isFamiliesLoading } from '$lib/stores/families';
	import { FAMILY_COLORS, type FamilyMember, type FamilyColor } from '$lib/types';
	import { getMonogram, getFamilyColorClasses } from '$lib/utils';

	let showInviteModal = false;
	let showSettingsModal = false;
	let showLeaveModal = false;
	let editName = '';
	let editDescription = '';
	let editColor: FamilyColor = 'orange';
	let editEmoji = '';
	let copied = false;

	// Common family emojis
	const FAMILY_EMOJIS = ['👨‍👩‍👧‍👦', '🏠', '❤️', '⭐', '🌟', '🎉', '🌈', '🦁', '🐻', '🦊', '🐼', '🌸', '🌺', '🍀', '🔥', '💪'];

	$: familyId = $page.params.id;
	$: isAdmin = $currentFamily?.members.some(m => m.userId === $user?.id && m.role === 'admin');
	$: previewColors = getFamilyColorClasses(editColor);

	onMount(async () => {
		if (!$isAuthenticated) {
			goto('/login');
			return;
		}
		await families.loadFamily(familyId);
	});

	function copyInviteCode() {
		if ($currentFamily) {
			navigator.clipboard.writeText($currentFamily.inviteCode);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	async function copyInviteLink() {
		if ($currentFamily) {
			const link = `${window.location.origin}/join?code=${$currentFamily.inviteCode}`;
			await navigator.clipboard.writeText(link);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	async function regenerateCode() {
		await families.regenerateInviteCode(familyId);
	}

	function openSettings() {
		if ($currentFamily) {
			editName = $currentFamily.name;
			editDescription = $currentFamily.description || '';
			editColor = $currentFamily.color || 'orange';
			editEmoji = $currentFamily.emoji || '';
			showSettingsModal = true;
		}
	}

	async function saveSettings() {
		await families.updateFamily(familyId, {
			name: editName,
			description: editDescription || undefined,
			color: editColor,
			emoji: editEmoji || null,
		});
		showSettingsModal = false;
	}

	function clearEmoji() {
		editEmoji = '';
	}

	async function leaveFamily() {
		if ($user) {
			await families.leaveFamily(familyId, $user.id);
			goto('/dashboard');
		}
	}

	async function removeMember(member: FamilyMember) {
		if (confirm(`Remove ${member.user.name} from the family?`)) {
			await families.leaveFamily(familyId, member.userId);
			await families.loadFamily(familyId);
		}
	}

	async function toggleRole(member: FamilyMember) {
		const newRole = member.role === 'admin' ? 'member' : 'admin';
		// This would need an API call - simplified for now
		await families.loadFamily(familyId);
	}
</script>

<svelte:head>
	<title>{$currentFamily?.name || 'Family'} - FamilyFast</title>
</svelte:head>

{#if $isFamiliesLoading}
	<div class="max-w-4xl mx-auto px-4 py-8">
		<div class="animate-pulse">
			<div class="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
			<div class="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
			<div class="card h-48"></div>
		</div>
	</div>
{:else if $currentFamily}
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Header -->
		<div class="flex items-start justify-between mb-8">
			<div class="flex items-center gap-4">
				<a href="/dashboard" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</a>
				<div>
					<h1 class="font-display text-3xl font-bold text-gray-900">{$currentFamily.name}</h1>
					{#if $currentFamily.description}
						<p class="text-gray-600 mt-1">{$currentFamily.description}</p>
					{/if}
				</div>
			</div>

			{#if isAdmin}
				<button on:click={openSettings} class="btn-ghost">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</button>
			{/if}
		</div>

		<div class="grid lg:grid-cols-3 gap-8">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Coming Soon Banner -->
				<div class="card bg-gradient-to-r from-secondary-50 to-accent-50 border border-secondary-100">
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
							<svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<div>
							<h3 class="font-display font-bold text-gray-900">More features coming soon!</h3>
							<p class="text-gray-600 text-sm">Health tracking, challenges, recipes, and discussion feeds are on the way.</p>
						</div>
					</div>
				</div>

				<!-- Activity Feed Placeholder -->
				<div class="card">
					<h2 class="font-display text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
					<div class="text-center py-8">
						<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						</div>
						<p class="text-gray-600">No activity yet. Start sharing with your family!</p>
					</div>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Invite Card -->
				<div class="card">
					<h2 class="font-display text-lg font-bold text-gray-900 mb-4">Invite Members</h2>
					<p class="text-gray-600 text-sm mb-4">Share this code with family members to invite them:</p>
					
					<div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between mb-4">
						<code class="font-mono text-lg font-medium text-gray-900">{$currentFamily.inviteCode}</code>
						<button on:click={copyInviteCode} class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
							{#if copied}
								<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{:else}
								<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
							{/if}
						</button>
					</div>

					<div class="flex gap-2">
						<button on:click={copyInviteLink} class="btn-outline flex-1 text-sm">
							Copy Link
						</button>
						{#if isAdmin}
							<button on:click={regenerateCode} class="btn-ghost text-sm">
								Regenerate
							</button>
						{/if}
					</div>
				</div>

				<!-- Members Card -->
				<div class="card">
					<h2 class="font-display text-lg font-bold text-gray-900 mb-4">
						Members ({$currentFamily.members.length})
					</h2>
					
					<div class="space-y-3">
						{#each $currentFamily.members as member}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
										<span class="text-primary-600 font-medium">
											{member.user.name.charAt(0).toUpperCase()}
										</span>
									</div>
									<div>
										<p class="font-medium text-gray-900">
											{member.user.name}
											{#if member.userId === $user?.id}
												<span class="text-gray-500 text-sm">(you)</span>
											{/if}
										</p>
										<p class="text-sm text-gray-500 capitalize">{member.role}</p>
									</div>
								</div>

								{#if isAdmin && member.userId !== $user?.id}
									<button
										on:click={() => removeMember(member)}
										class="p-1 text-gray-400 hover:text-red-500 transition-colors"
										title="Remove member"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Leave Family -->
				<button
					on:click={() => (showLeaveModal = true)}
					class="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
				>
					Leave Family
				</button>
			</div>
		</div>
	</div>

	<!-- Settings Modal -->
	{#if showSettingsModal}
		<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div class="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
				<h2 class="font-display text-2xl font-bold text-gray-900 mb-6">Family Settings</h2>

				<form on:submit|preventDefault={saveSettings} class="space-y-6">
					<!-- Preview -->
					<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
						<div class="w-16 h-16 rounded-xl bg-gradient-to-br {previewColors.light} flex items-center justify-center">
							{#if editEmoji}
								<span class="text-3xl">{editEmoji}</span>
							{:else}
								<span class="{previewColors.text} font-bold text-2xl">
									{getMonogram(editName || 'F')}
								</span>
							{/if}
						</div>
						<div>
							<p class="font-display font-bold text-gray-900">{editName || 'Family Name'}</p>
							<p class="text-sm text-gray-500">Preview</p>
						</div>
					</div>

					<!-- Name -->
					<div>
						<label for="editName" class="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
						<input type="text" id="editName" bind:value={editName} class="input" required />
					</div>

					<!-- Description -->
					<div>
						<label for="editDesc" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
						<textarea id="editDesc" bind:value={editDescription} class="input" rows="2" placeholder="A brief description of your family"></textarea>
					</div>

					<!-- Color -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Family Color</label>
						<div class="grid grid-cols-6 gap-2">
							{#each FAMILY_COLORS as color}
								<button
									type="button"
									on:click={() => (editColor = color.value)}
									class="w-full aspect-square rounded-xl bg-gradient-to-br {color.class} transition-all {editColor === color.value ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'}"
									title={color.label}
								></button>
							{/each}
						</div>
					</div>

					<!-- Emoji -->
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="block text-sm font-medium text-gray-700">Family Icon (optional)</label>
							{#if editEmoji}
								<button type="button" on:click={clearEmoji} class="text-sm text-gray-500 hover:text-gray-700">
									Clear
								</button>
							{/if}
						</div>
						
						<!-- Custom emoji input -->
						<div class="flex items-center gap-2 mb-3">
							<input
								type="text"
								bind:value={editEmoji}
								class="input flex-1"
								placeholder="Type or paste any emoji..."
								maxlength="20"
							/>
							{#if editEmoji && !FAMILY_EMOJIS.includes(editEmoji)}
								<div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
									{editEmoji}
								</div>
							{/if}
						</div>

						<!-- Quick pick emojis -->
						<p class="text-xs text-gray-500 mb-2">Or pick from suggestions:</p>
						<div class="grid grid-cols-8 gap-2">
							{#each FAMILY_EMOJIS as emoji}
								<button
									type="button"
									on:click={() => (editEmoji = emoji)}
									class="w-full aspect-square rounded-lg flex items-center justify-center text-xl hover:bg-gray-100 transition-colors {editEmoji === emoji ? 'bg-gray-100 ring-2 ring-gray-300' : ''}"
								>
									{emoji}
								</button>
							{/each}
						</div>
					</div>

					<div class="flex gap-3 pt-4 border-t border-gray-100">
						<button type="button" on:click={() => (showSettingsModal = false)} class="btn-ghost flex-1">
							Cancel
						</button>
						<button type="submit" class="btn-primary flex-1">
							Save Changes
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Leave Modal -->
	{#if showLeaveModal}
		<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div class="card w-full max-w-md">
				<h2 class="font-display text-2xl font-bold text-gray-900 mb-4">Leave Family?</h2>
				<p class="text-gray-600 mb-6">
					Are you sure you want to leave "{$currentFamily.name}"? You'll need a new invite code to rejoin.
				</p>

				<div class="flex gap-3">
					<button on:click={() => (showLeaveModal = false)} class="btn-ghost flex-1">
						Cancel
					</button>
					<button on:click={leaveFamily} class="btn-primary bg-red-500 hover:bg-red-600 flex-1">
						Leave Family
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
