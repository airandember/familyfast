<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user, isAuthenticated } from '$lib/stores/auth';
	import { families, currentFamily, isFamiliesLoading } from '$lib/stores/families';
	import { feedsStore, commentsStore } from '$lib/stores/feeds';
	import { milestonesStore } from '$lib/stores/milestones';
	import { challengesStore } from '$lib/stores/challenges';
	import { healthStore } from '$lib/stores/health';
	import { FAMILY_COLORS, REACTION_EMOJIS, MILESTONE_TYPES, type FamilyMember, type FamilyColor, type ReactionType, type MilestoneType } from '$lib/types';
	import { getMonogram, getFamilyColorClasses, formatRelativeTime } from '$lib/utils';

	// Animation state
	let mounted = false;

	// Modals
	let showInviteModal = false;
	let showSettingsModal = false;
	let showLeaveModal = false;
	let showMilestoneModal = false;
	let showCommentsModal = false;
	let showPostSheet = false;
	
	let selectedPostId: string | null = null;
	let editName = '';
	let editDescription = '';
	let editColor: FamilyColor = 'orange';
	let editEmoji = '';
	let copied = false;

	// Post composer
	let newPostContent = '';
	let isPosting = false;

	// Milestone form
	let milestoneTitle = '';
	let milestoneDescription = '';
	let milestoneDate = '';
	let milestoneType: MilestoneType = 'custom';
	let milestoneRecurring = false;
	let milestonePersonName = '';
	let customPersonName = '';
	let isSavingMilestone = false;

	// Comment form
	let newCommentContent = '';
	let isCommenting = false;

	// Common family emojis
	const FAMILY_EMOJIS = ['👨‍👩‍👧‍👦', '🏠', '❤️', '⭐', '🌟', '🎉', '🌈', '🦁', '🐻', '🦊', '🐼', '🌸', '🌺', '🍀', '🔥', '💪'];

	$: familyId = $page.params.id;
	$: isAdmin = $currentFamily?.members.some(m => m.userId === $user?.id && m.role === 'admin');
	$: previewColors = getFamilyColorClasses(editColor);
	$: familyColorClass = $currentFamily ? getFamilyColorClasses($currentFamily.color || 'orange') : getFamilyColorClasses('orange');
	
	// Active challenge (first active one)
	$: activeChallenge = $challengesStore.challenges?.find(c => c.status === 'active' && c.isParticipating);
	
	// Challenge participants for scatter plot
	$: challengeParticipants = $challengesStore.participants || [];
	
	// Auto-generate milestone title based on type and person
	$: {
		const person = milestonePersonName === '__custom__' ? customPersonName : milestonePersonName;
		if (person && milestoneType === 'birthday') {
			milestoneTitle = `${person}'s Birthday`;
		} else if (person && milestoneType === 'anniversary') {
			milestoneTitle = `${person}'s Anniversary`;
		}
	}

	onMount(async () => {
		if (!$isAuthenticated) {
			goto('/login');
			return;
		}
		await Promise.all([
			families.loadFamily(familyId),
			feedsStore.loadPosts(familyId),
			milestonesStore.loadFamilyMilestones(familyId),
			challengesStore.loadChallenges(familyId),
		]);
		
		// Load participants for active challenge
		const active = $challengesStore.challenges.find(c => c.status === 'active');
		if (active) {
			await challengesStore.loadParticipants(active.id);
		}
		
		setTimeout(() => (mounted = true), 100);
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
			await families.removeMember(familyId, member.userId);
		}
	}

	async function createPost() {
		if (!newPostContent.trim()) return;
		isPosting = true;
		await feedsStore.createPost(familyId, { content: newPostContent.trim() });
		newPostContent = '';
		isPosting = false;
		showPostSheet = false;
	}

	async function deletePost(postId: string) {
		if (confirm('Delete this post?')) {
			await feedsStore.deletePost(postId);
		}
	}

	async function toggleReaction(postId: string, emoji: ReactionType) {
		await feedsStore.toggleReaction(postId, emoji);
	}

	function openComments(postId: string) {
		selectedPostId = postId;
		showCommentsModal = true;
		commentsStore.loadComments(postId);
	}

	async function addComment() {
		if (!selectedPostId || !newCommentContent.trim()) return;
		isCommenting = true;
		await commentsStore.addComment(selectedPostId, { content: newCommentContent.trim() });
		newCommentContent = '';
		isCommenting = false;
	}

	async function deleteComment(commentId: string) {
		if (confirm('Delete this comment?')) {
			await commentsStore.deleteComment(commentId);
		}
	}

	function closeComments() {
		showCommentsModal = false;
		selectedPostId = null;
		commentsStore.reset();
	}

	// Milestones
	function openMilestoneModal() {
		milestoneTitle = '';
		milestoneDescription = '';
		milestoneDate = '';
		milestoneType = 'custom';
		milestoneRecurring = false;
		milestonePersonName = '';
		customPersonName = '';
		showMilestoneModal = true;
	}

	async function saveMilestone() {
		if (!milestoneTitle.trim() || !milestoneDate) return;
		isSavingMilestone = true;
		
		const personName = milestonePersonName === '__custom__' 
			? customPersonName.trim() 
			: milestonePersonName;
		
		try {
			await milestonesStore.createMilestone(familyId, {
				title: milestoneTitle.trim(),
				description: milestoneDescription.trim() || undefined,
				date: milestoneDate,
				type: milestoneType,
				recurring: milestoneRecurring,
				personName: personName || undefined,
			});
			showMilestoneModal = false;
		} catch (e) {
			console.error(e);
		} finally {
			isSavingMilestone = false;
		}
	}

	async function deleteMilestone(id: string) {
		if (confirm('Delete this milestone?')) {
			await milestonesStore.deleteMilestone(id);
		}
	}

	// Scatter plot helpers
	function getScatterPoints() {
		if (!challengeParticipants || challengeParticipants.length === 0) return [];
		
		return challengeParticipants.map((p) => {
			// X: completion rate (0-100)
			// Y: streak days (scaled)
			const x = p.progress?.completionRate || 0;
			const maxStreak = Math.max(...challengeParticipants.map(cp => cp.progress?.currentStreak || 0), 1);
			const y = ((p.progress?.currentStreak || 0) / maxStreak) * 100;
			
			return {
				x,
				y,
				user: p.user,
				progress: p.progress,
				isMe: p.userId === $user?.id,
			};
		});
	}
	
	$: scatterPoints = getScatterPoints();
</script>

<svelte:head>
	<title>{$currentFamily?.name || 'Family'} - FamilyFast</title>
</svelte:head>

<!-- Background -->
<div class="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 -z-10"></div>

{#if $isFamiliesLoading}
	<div class="min-h-screen flex flex-col items-center justify-center">
		<div class="relative w-20 h-20">
			<div class="absolute inset-0 rounded-full border-4 border-gray-200"></div>
			<div class="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
		</div>
		<p class="mt-4 text-gray-500">Loading family...</p>
	</div>
{:else if $currentFamily}
	<div class="min-h-screen pb-24">
		<!-- Hero Header -->
		<div class="relative overflow-hidden">
			<div class="absolute inset-0 bg-gradient-to-br {familyColorClass.gradient}"></div>
			<div class="absolute inset-0 bg-black/10"></div>
			<!-- Pattern overlay -->
			<div class="absolute inset-0 opacity-10" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34c0-2.209-1.791-4-4-4s-4 1.791-4 4 1.791 4 4 4 4-1.791 4-4z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
			
			<div class="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
				<!-- Top nav -->
				<div class="flex items-center justify-between mb-6">
					<a 
						href="/dashboard" 
						class="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors touch-target"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</a>
					
					<div class="flex items-center gap-2">
						<button
							on:click={() => (showInviteModal = true)}
							class="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors touch-target"
							title="Invite"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
							</svg>
						</button>
						{#if isAdmin}
							<button
								on:click={openSettings}
								class="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors touch-target"
								title="Settings"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</button>
						{/if}
					</div>
				</div>

				<!-- Family info -->
				<div class="flex items-center gap-4">
					<div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
						{#if $currentFamily.emoji}
							<span class="text-4xl">{$currentFamily.emoji}</span>
						{:else}
							<span class="text-white font-bold text-3xl">
								{getMonogram($currentFamily.name)}
							</span>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<h1 class="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg truncate">
							{$currentFamily.name}
						</h1>
						{#if $currentFamily.description}
							<p class="text-white/80 text-sm mt-1 line-clamp-2">{$currentFamily.description}</p>
						{/if}
						<div class="flex items-center gap-3 mt-2 text-white/70 text-sm">
							<span class="flex items-center gap-1">
								<span>👥</span> {$currentFamily.members.length} members
							</span>
							{#if activeChallenge}
								<span class="flex items-center gap-1">
									<span>🔥</span> Challenge active
								</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Members row -->
				<div class="flex items-center gap-2 mt-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
					{#each $currentFamily.members as member, i}
					<div 
						class="flex-shrink-0 w-12 h-12 p-4 rounded-full bg-white/30 backdrop-blur flex items-center justify-center ring-2 ring-white/50 {i > 0 ? '-ml-3' : ''}"
						style="z-index: {$currentFamily.members.length - i}"
						title={member.user.name}
					>
							<span class="font-bold text-white text-sm">
								{member.user.name.charAt(0).toUpperCase()}
							</span>
						</div>
					{/each}
					<button
						on:click={() => (showInviteModal = true)}
						class="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 border-2 border-dashed border-white/50 flex items-center justify-center hover:bg-white/30 transition-colors -ml-3"
						style="z-index: 0"
					>
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
					</button>
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
			<div class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
				<button
					on:click={() => (showPostSheet = true)}
					class="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 touch-target"
				>
					<span class="text-xl">✏️</span>
					<span class="font-medium">Post</span>
				</button>
				<a
					href="/families/{familyId}/challenges"
					class="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 touch-target"
				>
					<span class="text-xl">🎯</span>
					<span class="font-medium">Challenges</span>
				</a>
				<button
					on:click={openMilestoneModal}
					class="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 touch-target"
				>
					<span class="text-xl">🎂</span>
					<span class="font-medium">Milestone</span>
				</button>
				<button
					on:click={() => (showInviteModal = true)}
					class="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 touch-target"
				>
					<span class="text-xl">📨</span>
					<span class="font-medium">Invite</span>
				</button>
			</div>
		</div>

		<div class="max-w-6xl mx-auto px-4 sm:px-6 py-6">
			<!-- Current Challenge Spotlight -->
			{#if activeChallenge || $challengesStore.challenges.length > 0}
				{@const challenge = activeChallenge || $challengesStore.challenges[0]}
				<div class="mb-6 {mounted ? 'animate-fade-in-up' : 'opacity-0'}">
					<a 
						href="/families/{familyId}/challenges/{challenge.id}"
						class="block bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all active:scale-[0.99]"
					>
						<div class="flex items-start justify-between mb-4">
							<div>
								<div class="flex items-center gap-2 mb-1">
									<span class="text-2xl">{challenge.emoji || '🔥'}</span>
									<h3 class="text-xl font-bold">{challenge.name}</h3>
								</div>
								<p class="text-white/80 text-sm">
									{challenge.participantCount} participating • 
									{#if challenge.settings}
										{challenge.settings.fastingHours}:{24 - challenge.settings.fastingHours} Protocol
									{:else}
										Active challenge
									{/if}
								</p>
							</div>
							{#if challenge.myProgress}
								<div class="text-right">
									<div class="text-3xl font-bold">{challenge.myProgress.completionRate}%</div>
									<div class="text-white/70 text-sm">🔥 {challenge.myProgress.currentStreak} streak</div>
								</div>
							{:else}
								<span class="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
									Join Now →
								</span>
							{/if}
						</div>

						<!-- Participant Progress Scatter Plot -->
						{#if scatterPoints.length > 0}
							<div class="relative h-32 bg-white/10 rounded-2xl p-4 mt-2">
								<!-- Grid lines -->
								<div class="absolute inset-4 border-l border-b border-white/20"></div>
								<div class="absolute left-4 right-4 top-1/2 border-t border-dashed border-white/10"></div>
								<div class="absolute top-4 bottom-4 left-1/2 border-l border-dashed border-white/10"></div>
								
								<!-- Points -->
								{#each scatterPoints as point}
									<div 
										class="absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-125 {point.isMe ? 'bg-white text-orange-600 ring-2 ring-white shadow-lg' : 'bg-white/30 text-white'}"
										style="left: calc({point.x}% - 16px + 16px); bottom: calc({point.y}% - 16px + 16px);"
										title="{point.user?.name || 'User'}: {point.progress?.completionRate || 0}% complete, {point.progress?.currentStreak || 0} streak"
									>
										{point.user?.name?.charAt(0) || '?'}
									</div>
								{/each}
								
								<!-- Axis labels -->
								<div class="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-white/50">Completion %</div>
								<div class="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-white/50">Streak</div>
							</div>
						{/if}
					</a>
				</div>
			{:else}
				<!-- No challenge CTA -->
				<div class="mb-6 {mounted ? 'animate-fade-in-up' : 'opacity-0'}">
					<a 
						href="/families/{familyId}/challenges"
						class="block bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all group"
					>
						<div class="flex items-center gap-4">
							<div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center group-hover:scale-110 transition-transform">
								<span class="text-3xl">🎯</span>
							</div>
							<div class="flex-1">
								<h3 class="text-lg font-bold text-gray-900">Start a Family Challenge</h3>
								<p class="text-gray-600 text-sm">Track fasting, exercise, or custom goals together!</p>
							</div>
							<svg class="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</a>
				</div>
			{/if}

			<div class="grid lg:grid-cols-3 gap-6">
				<!-- Main Content (Posts) -->
				<div class="lg:col-span-2 space-y-4">
					<div class="flex items-center justify-between mb-2">
						<h2 class="text-lg font-bold text-gray-900">Recent Activity</h2>
						<button 
							on:click={() => (showPostSheet = true)}
							class="text-sm font-medium text-primary-600 hover:text-primary-700"
						>
							+ New Post
						</button>
					</div>

					{#if $feedsStore.posts.length === 0 && !$feedsStore.loading}
						<div class="bg-white rounded-3xl shadow-lg p-8 text-center {mounted ? 'animate-fade-in-up stagger-2' : 'opacity-0'}">
							<div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
								<span class="text-4xl">💬</span>
							</div>
							<h3 class="text-lg font-bold text-gray-900 mb-2">No posts yet</h3>
							<p class="text-gray-600 mb-4">Be the first to share with your family!</p>
							<button 
								on:click={() => (showPostSheet = true)}
								class="px-6 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
							>
								Create Post
							</button>
						</div>
					{:else}
						{#each $feedsStore.posts as post, i}
							<div class="bg-white rounded-3xl shadow-lg overflow-hidden {mounted ? 'animate-fade-in-up' : 'opacity-0'}" style="animation-delay: {0.1 + i * 0.05}s">
								<!-- Post Header -->
								<div class="p-5 pb-3">
									<div class="flex items-start justify-between">
										<div class="flex items-center gap-3">
											<div class="w-11 h-11 rounded-full bg-gradient-to-br {familyColorClass.light} flex items-center justify-center">
												<span class="{familyColorClass.text} font-bold">
													{post.author.name.charAt(0).toUpperCase()}
												</span>
											</div>
											<div>
												<p class="font-semibold text-gray-900">{post.author.name}</p>
												<p class="text-sm text-gray-500">{formatRelativeTime(post.createdAt)}</p>
											</div>
										</div>
										{#if post.authorId === $user?.id || isAdmin}
											<button
												on:click={() => deletePost(post.id)}
												class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										{/if}
									</div>
								</div>

								<!-- Post Content -->
								<div class="px-5 pb-4">
									<p class="text-gray-900 whitespace-pre-wrap">{post.content}</p>
								</div>

								<!-- Reactions -->
								<div class="px-5 pb-4 flex items-center gap-1 flex-wrap">
									{#each Object.entries(REACTION_EMOJIS) as [type, emoji]}
										{@const reaction = post.reactions.find(r => r.emoji === type)}
										{@const count = reaction?.count || 0}
										<button
											on:click={() => toggleReaction(post.id, type)}
											class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all touch-target {
												post.userReaction === type 
													? 'bg-primary-100 text-primary-700' 
													: count > 0 
														? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
														: 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
											}"
										>
											<span class="text-base">{emoji}</span>
											{#if count > 0}
												<span class="font-medium">{count}</span>
											{/if}
										</button>
									{/each}
								</div>

								<!-- Comments button -->
								<div class="px-5 py-3 border-t border-gray-100">
									<button
										on:click={() => openComments(post.id)}
										class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
										</svg>
										<span class="text-sm font-medium">
											{post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}
										</span>
									</button>
								</div>
							</div>
						{/each}

						{#if $feedsStore.hasMore}
							<button
								on:click={() => feedsStore.loadMore(familyId)}
								disabled={$feedsStore.loading}
								class="w-full py-4 bg-white rounded-2xl shadow-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors"
							>
								{$feedsStore.loading ? 'Loading...' : 'Load more'}
							</button>
						{/if}
					{/if}
				</div>

				<!-- Sidebar -->
				<div class="space-y-4">
					<!-- Members Card -->
					<div class="bg-white rounded-3xl shadow-lg p-5 {mounted ? 'animate-fade-in-up stagger-3' : 'opacity-0'}">
						<h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
							<span>👥</span> Family Members
						</h3>
						<div class="space-y-3">
							{#each $currentFamily.members as member}
								<div class="flex items-center justify-between group">
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 rounded-full bg-gradient-to-br {familyColorClass.light} flex items-center justify-center">
											<span class="{familyColorClass.text} font-bold text-sm">
												{member.user.name.charAt(0).toUpperCase()}
											</span>
										</div>
										<div>
											<p class="font-medium text-gray-900 text-sm">
												{member.user.name}
												{#if member.userId === $user?.id}
													<span class="text-gray-400">(you)</span>
												{/if}
											</p>
											<p class="text-xs text-gray-500 capitalize">{member.role}</p>
										</div>
									</div>
									{#if isAdmin && member.userId !== $user?.id}
										<button
											on:click={() => removeMember(member)}
											class="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Milestones Card -->
					<div class="bg-white rounded-3xl shadow-lg p-5 {mounted ? 'animate-fade-in-up stagger-4' : 'opacity-0'}">
						<div class="flex items-center justify-between mb-4">
							<h3 class="font-bold text-gray-900 flex items-center gap-2">
								<span>🎂</span> Milestones
							</h3>
							<button 
								on:click={openMilestoneModal}
								class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
							</button>
						</div>

						{#if $milestonesStore.milestones.length === 0}
							<p class="text-gray-500 text-sm text-center py-4">No milestones yet</p>
						{:else}
							<div class="space-y-3">
								{#each $milestonesStore.milestones.slice(0, 4) as milestone}
									{@const typeInfo = MILESTONE_TYPES.find(t => t.value === milestone.type)}
									<div class="flex items-center gap-3 group">
										<div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
											{milestone.emoji || typeInfo?.emoji || '📅'}
										</div>
										<div class="flex-1 min-w-0">
											<p class="font-medium text-gray-900 text-sm truncate">{milestone.title}</p>
											<p class="text-xs text-gray-500">
												{new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
												{#if milestone.recurring}
													<span class="ml-1">🔄</span>
												{/if}
											</p>
										</div>
										<button
											on:click={() => deleteMilestone(milestone.id)}
											class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Invite Card -->
					<div class="bg-white rounded-3xl shadow-lg p-5 {mounted ? 'animate-fade-in-up stagger-5' : 'opacity-0'}">
						<h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
							<span>📨</span> Invite Code
						</h3>
						<div class="bg-gray-50 rounded-2xl p-4 text-center mb-3">
							<code class="font-mono text-2xl font-bold text-gray-900 tracking-wider">
								{$currentFamily.inviteCode}
							</code>
						</div>
						<div class="flex gap-2">
							<button 
								on:click={copyInviteCode}
								class="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
							>
								{copied ? '✓ Copied!' : 'Copy Code'}
							</button>
							<button 
								on:click={copyInviteLink}
								class="flex-1 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors"
							>
								Share Link
							</button>
						</div>
					</div>

					<!-- Leave Family -->
					<button
						on:click={() => (showLeaveModal = true)}
						class="w-full text-left px-5 py-4 bg-white rounded-2xl shadow-lg text-red-600 hover:bg-red-50 transition-colors {mounted ? 'animate-fade-in-up stagger-6' : 'opacity-0'}"
					>
						Leave Family
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Post Bottom Sheet -->
	{#if showPostSheet}
		<div class="fixed inset-0 bg-black/50 z-50 animate-fade-in" on:click={() => (showPostSheet = false)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showPostSheet = false)}></div>
		<div class="bottom-sheet">
			<div class="bottom-sheet-handle"></div>
			<div class="px-6 pb-8">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-bold text-gray-900">New Post</h2>
					<button on:click={() => (showPostSheet = false)} class="p-2 text-gray-400 hover:text-gray-600 rounded-full touch-target">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form on:submit|preventDefault={createPost} class="space-y-4">
					<textarea
						bind:value={newPostContent}
						placeholder="Share something with your family..."
						class="input resize-none text-lg"
						rows="4"
						autofocus
					></textarea>
					<button
						type="submit"
						disabled={!newPostContent.trim() || isPosting}
						class="w-full py-4 rounded-2xl text-lg font-bold text-white bg-gradient-to-r {familyColorClass.gradient} shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
					>
						{isPosting ? 'Posting...' : 'Post to Family'}
					</button>
				</form>
			</div>
		</div>
	{/if}

	<!-- Invite Modal -->
	{#if showInviteModal}
		<div class="fixed inset-0 bg-black/50 z-50 animate-fade-in" on:click={() => (showInviteModal = false)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showInviteModal = false)}></div>
		<div class="bottom-sheet">
			<div class="bottom-sheet-handle"></div>
			<div class="px-6 pb-8">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-gray-900">Invite Members</h2>
					<button on:click={() => (showInviteModal = false)} class="p-2 text-gray-400 hover:text-gray-600 rounded-full touch-target">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="text-center mb-6">
					<div class="bg-gray-100 rounded-3xl p-6 mb-4">
						<code class="font-mono text-4xl font-bold text-gray-900 tracking-widest">
							{$currentFamily.inviteCode}
						</code>
					</div>
					<p class="text-gray-600 text-sm">Share this code with family members to invite them</p>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<button 
						on:click={copyInviteCode}
						class="py-4 rounded-2xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
					>
						{copied ? '✓ Copied!' : '📋 Copy Code'}
					</button>
					<button 
						on:click={copyInviteLink}
						class="py-4 rounded-2xl font-medium text-white bg-gradient-to-r {familyColorClass.gradient} hover:opacity-90 transition-colors"
					>
						🔗 Share Link
					</button>
				</div>

				{#if isAdmin}
					<button 
						on:click={regenerateCode}
						class="w-full mt-4 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
					>
						🔄 Regenerate Code
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Settings Modal -->
	{#if showSettingsModal}
		<div class="fixed inset-0 bg-black/50 z-50 animate-fade-in" on:click={() => (showSettingsModal = false)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showSettingsModal = false)}></div>
		<div class="bottom-sheet max-h-[90vh] overflow-y-auto">
			<div class="bottom-sheet-handle"></div>
			<div class="px-6 pb-8">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-gray-900">Family Settings</h2>
					<button on:click={() => (showSettingsModal = false)} class="p-2 text-gray-400 hover:text-gray-600 rounded-full touch-target">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form on:submit|preventDefault={saveSettings} class="space-y-6">
					<!-- Preview -->
					<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
						<div class="w-16 h-16 rounded-2xl bg-gradient-to-br {previewColors.light} flex items-center justify-center">
							{#if editEmoji}
								<span class="text-3xl">{editEmoji}</span>
							{:else}
								<span class="{previewColors.text} font-bold text-2xl">
									{getMonogram(editName || 'F')}
								</span>
							{/if}
						</div>
						<div>
							<p class="font-bold text-gray-900">{editName || 'Family Name'}</p>
							<p class="text-sm text-gray-500">Preview</p>
						</div>
					</div>

					<!-- Name -->
					<div>
						<label for="editName" class="block text-sm font-medium text-gray-700 mb-2">Family Name</label>
						<input type="text" id="editName" bind:value={editName} class="input text-lg" required />
					</div>

					<!-- Description -->
					<div>
						<label for="editDesc" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
						<textarea id="editDesc" bind:value={editDescription} class="input" rows="2" placeholder="A brief description..."></textarea>
					</div>

					<!-- Color -->
					<div>
						<span class="block text-sm font-medium text-gray-700 mb-3">Family Color</span>
						<div class="grid grid-cols-6 gap-3">
							{#each FAMILY_COLORS as color}
								<button
									type="button"
									on:click={() => (editColor = color.value)}
									class="aspect-square rounded-2xl bg-gradient-to-br {color.class} transition-all touch-target {editColor === color.value ? 'ring-4 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'}"
								></button>
							{/each}
						</div>
					</div>

					<!-- Emoji -->
					<div>
						<div class="flex items-center justify-between mb-3">
							<span class="text-sm font-medium text-gray-700">Family Icon</span>
							{#if editEmoji}
								<button type="button" on:click={clearEmoji} class="text-sm text-gray-500 hover:text-gray-700">
									Clear
								</button>
							{/if}
						</div>
						
						<input
							type="text"
							bind:value={editEmoji}
							class="input text-center text-2xl mb-3"
							placeholder="Type any emoji..."
							maxlength="20"
						/>

						<div class="grid grid-cols-8 gap-2">
							{#each FAMILY_EMOJIS as emoji}
								<button
									type="button"
									on:click={() => (editEmoji = emoji)}
									class="aspect-square rounded-xl flex items-center justify-center text-xl hover:bg-gray-100 transition-colors touch-target {editEmoji === emoji ? 'bg-gray-100 ring-2 ring-gray-300' : ''}"
								>
									{emoji}
								</button>
							{/each}
						</div>
					</div>

					<button 
						type="submit" 
						class="w-full py-4 rounded-2xl text-lg font-bold text-white bg-gradient-to-r {previewColors.gradient} shadow-lg transition-all active:scale-[0.98]"
					>
						Save Changes
					</button>
				</form>
			</div>
		</div>
	{/if}

	<!-- Leave Modal -->
	{#if showLeaveModal}
		<div class="fixed inset-0 bg-black/50 z-50 animate-fade-in" on:click={() => (showLeaveModal = false)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showLeaveModal = false)}></div>
		<div class="bottom-sheet">
			<div class="bottom-sheet-handle"></div>
			<div class="px-6 pb-8 text-center">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
					<span class="text-3xl">👋</span>
				</div>
				<h2 class="text-xl font-bold text-gray-900 mb-2">Leave Family?</h2>
				<p class="text-gray-600 mb-6">
					You'll need a new invite code to rejoin "{$currentFamily.name}".
				</p>

				<div class="grid grid-cols-2 gap-3">
					<button 
						on:click={() => (showLeaveModal = false)} 
						class="py-4 rounded-2xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
					>
						Cancel
					</button>
					<button 
						on:click={leaveFamily} 
						class="py-4 rounded-2xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
					>
						Leave
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Milestone Modal -->
	{#if showMilestoneModal}
		<div class="fixed inset-0 bg-black/50 z-50 animate-fade-in" on:click={() => (showMilestoneModal = false)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showMilestoneModal = false)}></div>
		<div class="bottom-sheet max-h-[90vh] overflow-y-auto">
			<div class="bottom-sheet-handle"></div>
			<div class="px-6 pb-8">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-gray-900">Add Milestone</h2>
					<button on:click={() => (showMilestoneModal = false)} class="p-2 text-gray-400 hover:text-gray-600 rounded-full touch-target">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form on:submit|preventDefault={saveMilestone} class="space-y-4">
					<!-- Type selection -->
					<div>
						<span class="block text-sm font-medium text-gray-700 mb-3">Type</span>
						<div class="grid grid-cols-4 gap-2">
							{#each MILESTONE_TYPES as type}
								<button
									type="button"
									on:click={() => (milestoneType = type.value)}
									class="p-3 rounded-2xl border-2 transition-all text-center touch-target {
										milestoneType === type.value 
											? 'border-primary-500 bg-primary-50' 
											: 'border-gray-200 hover:border-gray-300'
									}"
								>
									<span class="text-2xl block">{type.emoji}</span>
									<span class="text-xs font-medium">{type.label}</span>
								</button>
							{/each}
						</div>
					</div>

					{#if milestoneType === 'birthday' || milestoneType === 'anniversary'}
						<div>
							<label for="milestonePersonName" class="block text-sm font-medium text-gray-700 mb-2">
								{milestoneType === 'birthday' ? "Whose Birthday?" : "Who's Anniversary?"}
							</label>
							<select id="milestonePersonName" bind:value={milestonePersonName} class="input">
								<option value="">Select a family member...</option>
								{#each $currentFamily.members as member}
									<option value={member.user.name}>{member.user.name}</option>
								{/each}
								<option value="__custom__">Other...</option>
							</select>
						</div>

						{#if milestonePersonName === '__custom__'}
							<div>
								<label for="customPersonName" class="block text-sm font-medium text-gray-700 mb-2">Name</label>
								<input type="text" id="customPersonName" bind:value={customPersonName} class="input" placeholder="Enter name..." />
							</div>
						{/if}
					{/if}

					<div>
						<label for="milestoneTitle" class="block text-sm font-medium text-gray-700 mb-2">Title</label>
						<input type="text" id="milestoneTitle" bind:value={milestoneTitle} class="input text-lg" placeholder="e.g., Mom's Birthday" required />
					</div>

					<div>
						<label for="milestoneDate" class="block text-sm font-medium text-gray-700 mb-2">Date</label>
						<input type="date" id="milestoneDate" bind:value={milestoneDate} class="input" required />
					</div>

					<label class="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
						<input type="checkbox" bind:checked={milestoneRecurring} class="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
						<div>
							<span class="font-medium text-gray-900">Repeat yearly</span>
							<p class="text-sm text-gray-500">For birthdays and anniversaries</p>
						</div>
					</label>

					<button 
						type="submit" 
						class="w-full py-4 rounded-2xl text-lg font-bold text-white bg-gradient-to-r {familyColorClass.gradient} shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
						disabled={isSavingMilestone}
					>
						{isSavingMilestone ? 'Saving...' : 'Add Milestone'}
					</button>
				</form>
			</div>
		</div>
	{/if}

	<!-- Comments Modal -->
	{#if showCommentsModal && selectedPostId}
		{@const post = $feedsStore.posts.find(p => p.id === selectedPostId)}
		<div class="fixed inset-0 bg-black/50 z-50 animate-fade-in" on:click={closeComments} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && closeComments()}></div>
		<div class="bottom-sheet max-h-[85vh] flex flex-col">
			<div class="bottom-sheet-handle"></div>
			
			<div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
				<h2 class="text-lg font-bold text-gray-900">Comments</h2>
				<button on:click={closeComments} class="p-2 text-gray-400 hover:text-gray-600 rounded-full touch-target">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Comments list -->
			<div class="flex-1 overflow-y-auto px-6 py-4">
				{#if $commentsStore.loading}
					<div class="flex justify-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
					</div>
				{:else if $commentsStore.comments.length === 0}
					<p class="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
				{:else}
					<div class="space-y-4">
						{#each $commentsStore.comments as comment}
							<div class="flex gap-3 group">
								<div class="w-9 h-9 rounded-full bg-gradient-to-br {familyColorClass.light} flex items-center justify-center flex-shrink-0">
									<span class="{familyColorClass.text} font-bold text-sm">
										{comment.author.name.charAt(0).toUpperCase()}
									</span>
								</div>
								<div class="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
									<div class="flex items-center justify-between mb-1">
										<p class="font-medium text-gray-900 text-sm">{comment.author.name}</p>
										{#if comment.authorId === $user?.id || isAdmin}
											<button
												on:click={() => deleteComment(comment.id)}
												class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										{/if}
									</div>
									<p class="text-gray-700 text-sm">{comment.content}</p>
									<p class="text-xs text-gray-400 mt-1">{formatRelativeTime(comment.createdAt)}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Comment input -->
			<div class="px-6 py-4 border-t border-gray-100">
				<form on:submit|preventDefault={addComment} class="flex gap-2">
					<input
						type="text"
						bind:value={newCommentContent}
						placeholder="Write a comment..."
						class="input flex-1"
					/>
					<button
						type="submit"
						disabled={!newCommentContent.trim() || isCommenting}
						class="px-5 py-2 rounded-xl font-medium text-white bg-gradient-to-r {familyColorClass.gradient} disabled:opacity-50 transition-colors"
					>
						{isCommenting ? '...' : 'Send'}
					</button>
				</form>
			</div>
		</div>
	{/if}
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<p class="text-gray-500">Family not found</p>
	</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
