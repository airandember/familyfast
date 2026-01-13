<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { challengesStore, activeChallenges, myChallenges } from '$lib/stores/challenges';
  import { auth } from '$lib/stores/auth';
  import type { Challenge, ChallengeType, FastingSettings, CreateChallengeRequest } from '$lib/types';
  import { CHALLENGE_TYPES } from '$lib/types';

  $: familyId = $page.params.id;
  $: challenges = $challengesStore.challenges;
  $: loading = $challengesStore.loading;
  $: error = $challengesStore.error;

  // Animation states
  let mounted = false;

  // Create challenge modal
  let showCreateModal = false;
  let newChallenge: CreateChallengeRequest = {
    name: '',
    description: '',
    type: 'fasting',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    settings: {
      feedingWindowStart: '12:00',
      feedingWindowEnd: '20:00',
      fastingHours: 16,
    },
  };

  // Fasting presets with visual styles
  const fastingPresets = [
    { name: '16:8', hours: 16, feedingStart: '12:00', feedingEnd: '20:00', color: 'from-orange-400 to-orange-600', desc: 'Most popular' },
    { name: '18:6', hours: 18, feedingStart: '12:00', feedingEnd: '18:00', color: 'from-amber-400 to-orange-600', desc: 'Intermediate' },
    { name: '20:4', hours: 20, feedingStart: '14:00', feedingEnd: '18:00', color: 'from-red-400 to-orange-600', desc: 'Advanced' },
    { name: 'OMAD', hours: 23, feedingStart: '18:00', feedingEnd: '19:00', color: 'from-rose-400 to-red-600', desc: 'One meal' },
  ];

  let selectedPreset = fastingPresets[0];

  function selectPreset(preset: typeof fastingPresets[0]) {
    selectedPreset = preset;
    newChallenge.settings = {
      feedingWindowStart: preset.feedingStart,
      feedingWindowEnd: preset.feedingEnd,
      fastingHours: preset.hours,
    };
  }

  onMount(() => {
    if (familyId) {
      challengesStore.loadChallenges(familyId);
    }
    setTimeout(() => (mounted = true), 100);
  });

  async function createChallenge() {
    if (!newChallenge.name) return;
    
    const result = await challengesStore.createChallenge(familyId, {
      ...newChallenge,
      emoji: selectedPreset ? '🔥' : '🎯',
    });
    if (result) {
      showCreateModal = false;
      resetForm();
    }
  }

  function resetForm() {
    newChallenge = {
      name: '',
      description: '',
      type: 'fasting',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      settings: {
        feedingWindowStart: '12:00',
        feedingWindowEnd: '20:00',
        fastingHours: 16,
      },
    };
    selectedPreset = fastingPresets[0];
  }

  async function handleJoinChallenge(e: Event, challenge: Challenge) {
    e.preventDefault();
    e.stopPropagation();
    
    if (challenge.isParticipating) {
      await challengesStore.leaveChallenge(challenge.id);
    } else {
      await challengesStore.joinChallenge(challenge.id);
    }
  }

  function getChallengeTypeInfo(type: ChallengeType) {
    return CHALLENGE_TYPES.find(t => t.value === type) || CHALLENGE_TYPES[2];
  }

  function getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  function getProgressRingPath(percent: number, radius: number = 45): string {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return `${offset}`;
  }
</script>

<svelte:head>
  <title>Challenges | FamilyFast</title>
</svelte:head>

<!-- Background gradient -->
<div class="fixed inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 -z-10"></div>

<div class="min-h-screen pb-24">
  <!-- Hero Header -->
  <div class="relative overflow-hidden">
    <div class="absolute inset-0 gradient-fasting opacity-90"></div>
    <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
    
    <div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="flex items-center gap-3 mb-4">
        <a 
          href="/families/{familyId}" 
          class="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors touch-target"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div class="flex-1">
          <h1 class="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Family Challenges</h1>
          <p class="text-white/80 text-sm sm:text-base">Achieve goals together 💪</p>
        </div>
      </div>

      <!-- Quick stats -->
      {#if challenges.length > 0}
        <div class="flex gap-4 mt-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div class="flex-shrink-0 glass rounded-2xl px-4 py-3 min-w-[120px]">
            <div class="text-2xl font-bold text-white">{challenges.filter(c => c.status === 'active').length}</div>
            <div class="text-white/70 text-sm">Active</div>
          </div>
          <div class="flex-shrink-0 glass rounded-2xl px-4 py-3 min-w-[120px]">
            <div class="text-2xl font-bold text-white">{challenges.filter(c => c.isParticipating).length}</div>
            <div class="text-white/70 text-sm">Joined</div>
          </div>
          <div class="flex-shrink-0 glass rounded-2xl px-4 py-3 min-w-[120px]">
            <div class="text-2xl font-bold text-white">
              {Math.max(...challenges.filter(c => c.myProgress).map(c => c.myProgress?.currentStreak || 0), 0)}
            </div>
            <div class="text-white/70 text-sm">🔥 Best Streak</div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Error message -->
    {#if error}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 animate-fade-in-up flex items-center justify-between">
        <span>{error}</span>
        <button on:click={() => challengesStore.clearError()} class="p-1 hover:bg-red-100 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/if}

    <!-- Loading state -->
    {#if loading && challenges.length === 0}
      <div class="flex flex-col items-center justify-center py-20">
        <div class="relative w-16 h-16">
          <div class="absolute inset-0 rounded-full border-4 border-orange-200"></div>
          <div class="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
        </div>
        <p class="mt-4 text-gray-500">Loading challenges...</p>
      </div>
    {:else if challenges.length === 0}
      <!-- Empty state -->
      <div class="text-center py-12 animate-fade-in-up">
        <div class="relative inline-block">
          <div class="w-32 h-32 rounded-full gradient-fasting flex items-center justify-center animate-pulse-ring">
            <span class="text-6xl">🎯</span>
          </div>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mt-6 mb-2">Start Your First Challenge</h3>
        <p class="text-gray-600 mb-8 max-w-md mx-auto">
          Create a fasting challenge for your family. Track progress, compete on leaderboards, and achieve goals together!
        </p>
        <button 
          on:click={() => (showCreateModal = true)} 
          class="btn-primary text-lg px-8 py-4 touch-target"
        >
          <span class="mr-2">🔥</span> Create Challenge
        </button>
      </div>
    {:else}
      <!-- Challenges list -->
      <div class="space-y-4">
        {#each challenges as challenge, i (challenge.id)}
          {@const typeInfo = getChallengeTypeInfo(challenge.type)}
          {@const daysLeft = getDaysRemaining(challenge.endDate)}
          {@const progress = challenge.myProgress?.completionRate || 0}
          
          <a 
            href="/families/{familyId}/challenges/{challenge.id}"
            class="block opacity-0 {mounted ? 'animate-fade-in-up' : ''}"
            style="animation-delay: {i * 0.1}s"
          >
            <div class="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 active:scale-[0.98]">
              <!-- Status bar -->
              <div class="h-1 {challenge.status === 'active' ? 'gradient-fasting' : 'bg-gray-200'}"></div>
              
              <div class="p-5">
                <div class="flex items-start gap-4">
                  <!-- Progress ring / Icon -->
                  <div class="relative flex-shrink-0">
                    {#if challenge.isParticipating && challenge.myProgress}
                      <svg class="w-16 h-16 progress-ring" viewBox="0 0 100 100">
                        <circle 
                          class="progress-ring-track" 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke-width="8"
                        />
                        <circle 
                          class="progress-ring-fill text-orange-500 animate-progress-glow" 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="currentColor"
                          stroke-width="8"
                          stroke-dasharray="{2 * Math.PI * 45}"
                          stroke-dashoffset={getProgressRingPath(progress)}
                        />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-lg font-bold text-gray-900">{progress}%</span>
                      </div>
                    {:else}
                      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        <span class="text-3xl">{challenge.emoji || typeInfo.emoji}</span>
                      </div>
                    {/if}
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <h3 class="font-bold text-gray-900 text-lg truncate">{challenge.name}</h3>
                        <p class="text-gray-500 text-sm">
                          {#if challenge.settings}
                            {challenge.settings.fastingHours}:{24 - challenge.settings.fastingHours} Fasting
                          {:else}
                            {typeInfo.label}
                          {/if}
                        </p>
                      </div>
                      
                      <!-- Join button -->
                      <button
                        on:click={(e) => handleJoinChallenge(e, challenge)}
                        class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all touch-target {
                          challenge.isParticipating 
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }"
                      >
                        {challenge.isParticipating ? '✓ Joined' : 'Join'}
                      </button>
                    </div>

                    <!-- Stats row -->
                    <div class="flex items-center gap-4 mt-3">
                      <div class="flex items-center gap-1.5 text-sm text-gray-600">
                        <span class="text-base">👥</span>
                        <span>{challenge.participantCount}</span>
                      </div>
                      <div class="flex items-center gap-1.5 text-sm text-gray-600">
                        <span class="text-base">📅</span>
                        <span>{daysLeft}d left</span>
                      </div>
                      {#if challenge.myProgress}
                        <div class="flex items-center gap-1.5 text-sm font-medium text-orange-600">
                          <span class="text-base">🔥</span>
                          <span>{challenge.myProgress.currentStreak} streak</span>
                        </div>
                      {/if}
                    </div>
                  </div>

                  <!-- Arrow -->
                  <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Floating Action Button -->
  <div class="fixed bottom-6 right-6 z-40">
    <button
      on:click={() => (showCreateModal = true)}
      class="w-16 h-16 rounded-full gradient-fasting text-white shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>
</div>

<!-- Create Challenge Bottom Sheet -->
{#if showCreateModal}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 z-50 animate-fade-in"
    on:click={() => (showCreateModal = false)}
    on:keydown={(e) => e.key === 'Escape' && (showCreateModal = false)}
    role="button"
    tabindex="0"
  ></div>
  
  <!-- Bottom Sheet -->
  <div class="bottom-sheet overflow-y-auto">
    <div class="bottom-sheet-handle"></div>
    
    <div class="px-6 pb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">New Challenge</h2>
        <button 
          on:click={() => (showCreateModal = false)} 
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full touch-target"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form on:submit|preventDefault={createChallenge} class="space-y-6">
        <!-- Challenge Type Selection -->
        <div>
          <span class="block text-sm font-medium text-gray-700 mb-3">Challenge Type</span>
          <div class="grid grid-cols-3 gap-3">
            {#each CHALLENGE_TYPES as type}
              <button
                type="button"
                on:click={() => (newChallenge.type = type.value)}
                class="p-4 rounded-2xl border-2 transition-all text-center touch-target {
                  newChallenge.type === type.value 
                    ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/20' 
                    : 'border-gray-200 hover:border-gray-300'
                }"
              >
                <span class="text-3xl block mb-1">{type.emoji}</span>
                <span class="text-sm font-medium">{type.label}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Fasting Presets -->
        {#if newChallenge.type === 'fasting'}
          <div class="animate-fade-in-up">
            <span class="block text-sm font-medium text-gray-700 mb-3">⏱️ Fasting Schedule</span>
            <div class="grid grid-cols-2 gap-3">
              {#each fastingPresets as preset}
                <button
                  type="button"
                  on:click={() => selectPreset(preset)}
                  class="relative p-4 rounded-2xl border-2 transition-all text-left overflow-hidden touch-target {
                    selectedPreset?.name === preset.name 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }"
                >
                  <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r {preset.color}"></div>
                  <div class="text-2xl font-bold text-gray-900">{preset.name}</div>
                  <div class="text-sm text-gray-500">{preset.desc}</div>
                  <div class="text-xs text-gray-400 mt-1">
                    {preset.feedingStart} - {preset.feedingEnd}
                  </div>
                  {#if selectedPreset?.name === preset.name}
                    <div class="absolute top-3 right-3 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Challenge Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Challenge Name</label>
          <input
            type="text"
            id="name"
            bind:value={newChallenge.name}
            class="input text-lg"
            placeholder="e.g., January 16:8 Fast"
            required
          />
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">Start</label>
            <input
              type="date"
              id="startDate"
              bind:value={newChallenge.startDate}
              class="input"
              required
            />
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">End</label>
            <input
              type="date"
              id="endDate"
              bind:value={newChallenge.endDate}
              class="input"
              required
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="w-full py-4 rounded-2xl text-lg font-bold text-white gradient-fasting shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all active:scale-[0.98] touch-target"
          disabled={loading}
        >
          {#if loading}
            <span class="inline-block animate-spin mr-2">⏳</span>
          {:else}
            <span class="mr-2">🔥</span>
          {/if}
          Create Challenge
        </button>
      </form>
    </div>
  </div>
{/if}
