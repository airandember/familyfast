<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { challengesStore } from '$lib/stores/challenges';
  import { healthStore, latestWeight } from '$lib/stores/health';
  import { auth } from '$lib/stores/auth';
  import type { 
    Challenge, 
    ChallengeLog, 
    ChallengeParticipant, 
    FastingStatus,
    CreateFoodLogRequest 
  } from '$lib/types';
  import { FASTING_STATUS_LABELS } from '$lib/types';

  $: familyId = $page.params.id;
  $: challengeId = $page.params.challengeId;
  $: challenge = $challengesStore.currentChallenge;
  $: participants = $challengesStore.participants;
  $: logs = $challengesStore.logs;
  $: loading = $challengesStore.loading;
  $: currentUser = $auth.user;

  // Animation states
  let mounted = false;
  let showConfetti = false;

  // Timer state
  let countdown = { hours: 0, minutes: 0, seconds: 0 };
  let countdownInterval: number;
  let isInFeedingWindow = false;

  // Today's date
  const today = new Date().toISOString().split('T')[0];

  // Daily log form
  let logCompleted = false;
  let logFastingStatus: FastingStatus = 'fasting';
  let logNotes = '';
  let isSubmittingLog = false;

  // Bottom sheets
  let showFoodSheet = false;
  let showWeightSheet = false;
  let showCheckInSheet = false;

  // Food log form
  let foodDescription = '';
  let foodCalories: number | undefined;
  let foodProtein: number | undefined;
  let foodCarbs: number | undefined;
  let foodFat: number | undefined;

  // Weight log form
  let weightValue: number | undefined;
  let weightNotes = '';

  // Tab state
  let activeTab: 'progress' | 'leaderboard' | 'food' = 'progress';

  // Check if today is already logged
  $: todayLog = logs.find(l => l.date === today && l.userId === currentUser?.id);

  onMount(async () => {
    if (challengeId) {
      await challengesStore.loadChallenge(challengeId);
      await challengesStore.loadParticipants(challengeId);
      await challengesStore.loadLogs(challengeId);
      await healthStore.loadWeightLogs(90);
      await healthStore.loadFoodLogs(today);
      await healthStore.loadDailySummary(today);
    }
    setTimeout(() => (mounted = true), 100);
    startCountdownTimer();
  });

  onDestroy(() => {
    if (countdownInterval) clearInterval(countdownInterval);
  });

  function startCountdownTimer() {
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    if (!challenge?.settings) return;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [feedStartH, feedStartM] = challenge.settings.feedingWindowStart.split(':').map(Number);
    const [feedEndH, feedEndM] = challenge.settings.feedingWindowEnd.split(':').map(Number);
    
    const feedingStartMinutes = feedStartH * 60 + feedStartM;
    const feedingEndMinutes = feedEndH * 60 + feedEndM;
    
    isInFeedingWindow = currentMinutes >= feedingStartMinutes && currentMinutes <= feedingEndMinutes;
    
    // Calculate countdown to next transition
    let targetMinutes: number;
    if (isInFeedingWindow) {
      targetMinutes = feedingEndMinutes;
    } else if (currentMinutes < feedingStartMinutes) {
      targetMinutes = feedingStartMinutes;
    } else {
      // After feeding window, count to next day's feeding start
      targetMinutes = feedingStartMinutes + 24 * 60;
    }
    
    let diffMinutes = targetMinutes - currentMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    
    const diffSeconds = diffMinutes * 60 - now.getSeconds();
    
    countdown = {
      hours: Math.floor(diffSeconds / 3600),
      minutes: Math.floor((diffSeconds % 3600) / 60),
      seconds: diffSeconds % 60,
    };
  }

  async function submitDailyLog() {
    if (!challengeId || isSubmittingLog) return;
    isSubmittingLog = true;
    
    const result = await challengesStore.logDay(challengeId, {
      date: today,
      completed: logCompleted,
      fastingStatus: logFastingStatus,
      notes: logNotes || undefined,
    });

    if (result) {
      await challengesStore.loadChallenge(challengeId);
      showCheckInSheet = false;
      logNotes = '';
      
      // Show celebration if completed
      if (logCompleted) {
        showConfetti = true;
        setTimeout(() => (showConfetti = false), 3000);
      }
    }
    isSubmittingLog = false;
  }

  async function submitFoodLog() {
    const input: CreateFoodLogRequest = {
      description: foodDescription,
      calories: foodCalories,
      protein: foodProtein,
      carbs: foodCarbs,
      fat: foodFat,
    };

    const result = await healthStore.logFood(input);
    if (result) {
      showFoodSheet = false;
      foodDescription = '';
      foodCalories = undefined;
      foodProtein = undefined;
      foodCarbs = undefined;
      foodFat = undefined;
      await healthStore.loadFoodLogs(today);
      await healthStore.loadDailySummary(today);
    }
  }

  async function submitWeightLog() {
    if (!weightValue) return;

    const result = await healthStore.logWeight({
      weight: weightValue,
      date: today,
      notes: weightNotes || undefined,
    });

    if (result) {
      showWeightSheet = false;
      weightValue = undefined;
      weightNotes = '';
      await healthStore.loadWeightLogs(90);
      await healthStore.loadWeightTrend(90);
    }
  }

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }

  function padZero(n: number): string {
    return n.toString().padStart(2, '0');
  }

  // Generate calendar days for the challenge
  function getCalendarDays() {
    if (!challenge) return [];
    const days = [];
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    const current = new Date(start);
    
    // Add padding for first week
    const startDay = start.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push({ date: '', empty: true });
    }
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const log = logs.find(l => l.date === dateStr && l.userId === currentUser?.id);
      days.push({
        date: dateStr,
        dayOfMonth: current.getDate(),
        completed: log?.completed || false,
        logged: !!log,
        isPast: current < new Date(today),
        isToday: dateStr === today,
        empty: false,
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  $: calendarDays = getCalendarDays();

  function getProgressRingPath(percent: number, radius: number = 54): string {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return `${offset}`;
  }
</script>

<svelte:head>
  <title>{challenge?.name || 'Challenge'} | FamilyFast</title>
</svelte:head>

<!-- Confetti celebration -->
{#if showConfetti}
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    {#each Array(30) as _, i}
      <div 
        class="absolute text-2xl"
        style="
          left: {Math.random() * 100}%;
          top: -20px;
          animation: confetti {1.5 + Math.random()}s ease-out forwards;
          animation-delay: {Math.random() * 0.5}s;
        "
      >
        {['🎉', '⭐', '🔥', '💪', '✨'][Math.floor(Math.random() * 5)]}
      </div>
    {/each}
  </div>
{/if}

<!-- Background -->
<div class="fixed inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 -z-10"></div>

{#if loading && !challenge}
  <div class="min-h-screen flex flex-col items-center justify-center">
    <div class="relative w-20 h-20">
      <div class="absolute inset-0 rounded-full border-4 border-orange-200"></div>
      <div class="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
    </div>
    <p class="mt-4 text-gray-500">Loading challenge...</p>
  </div>
{:else if challenge}
  <div class="min-h-screen pb-32">
    <!-- Header with countdown -->
    <div class="relative overflow-hidden">
      <div class="absolute inset-0 {isInFeedingWindow ? 'gradient-feeding' : 'gradient-fasting'}"></div>
      <div class="absolute inset-0 bg-black/10"></div>
      
      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <!-- Back button and title -->
        <div class="flex items-center gap-3 mb-6">
          <a 
            href="/families/{familyId}/challenges" 
            class="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors touch-target"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-white truncate">{challenge.name}</h1>
            <p class="text-white/80 text-sm">{challenge.participantCount} participants</p>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <span class="text-2xl">{challenge.emoji || '🔥'}</span>
          </div>
        </div>

        <!-- Countdown timer -->
        {#if challenge.type === 'fasting' && challenge.settings && challenge.isParticipating}
          <div class="text-center py-4">
            <div class="inline-flex items-center gap-1 text-white/70 text-sm mb-3">
              <span class="text-lg">{isInFeedingWindow ? '🍽️' : '⏰'}</span>
              {isInFeedingWindow ? 'Feeding window closes in' : 'Feeding window opens in'}
            </div>
            
            <!-- Big countdown -->
            <div class="flex items-center justify-center gap-2 sm:gap-4">
              <div class="glass rounded-2xl px-4 sm:px-6 py-3">
                <div class="text-3xl sm:text-5xl font-bold text-white font-mono">{padZero(countdown.hours)}</div>
                <div class="text-white/60 text-xs uppercase tracking-wider">Hours</div>
              </div>
              <span class="text-3xl text-white/50">:</span>
              <div class="glass rounded-2xl px-4 sm:px-6 py-3">
                <div class="text-3xl sm:text-5xl font-bold text-white font-mono">{padZero(countdown.minutes)}</div>
                <div class="text-white/60 text-xs uppercase tracking-wider">Mins</div>
              </div>
              <span class="text-3xl text-white/50">:</span>
              <div class="glass rounded-2xl px-4 sm:px-6 py-3">
                <div class="text-3xl sm:text-5xl font-bold text-white font-mono">{padZero(countdown.seconds)}</div>
                <div class="text-white/60 text-xs uppercase tracking-wider">Secs</div>
              </div>
            </div>

            <!-- Feeding window times -->
            <div class="mt-4 text-white/70 text-sm">
              Feeding: {formatTime(challenge.settings.feedingWindowStart)} - {formatTime(challenge.settings.feedingWindowEnd)}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Quick action buttons -->
    {#if challenge.isParticipating}
      <div class="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <div class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            on:click={() => (showCheckInSheet = true)}
            class="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 touch-target"
          >
            <span class="text-xl">{todayLog ? '✅' : '📝'}</span>
            <span class="font-medium">{todayLog ? 'Update Check-in' : 'Daily Check-in'}</span>
          </button>
          
          {#if isInFeedingWindow}
            <button
              on:click={() => (showFoodSheet = true)}
              class="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 touch-target"
            >
              <span class="text-xl">🍽️</span>
              <span class="font-medium">Log Food</span>
            </button>
          {/if}
          
          <button
            on:click={() => (showWeightSheet = true)}
            class="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 touch-target"
          >
            <span class="text-xl">⚖️</span>
            <span class="font-medium">Log Weight</span>
          </button>
        </div>
      </div>
    {/if}

    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <!-- Join prompt for non-participants -->
      {#if !challenge.isParticipating}
        <div class="bg-white rounded-3xl shadow-lg p-8 text-center mb-6 animate-fade-in-up">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <span class="text-4xl">🔥</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Join This Challenge</h3>
          <p class="text-gray-600 mb-6">Start tracking your progress and compete with your family!</p>
          <button 
            on:click={() => challengesStore.joinChallenge(challenge.id)}
            class="px-8 py-4 rounded-2xl text-lg font-bold text-white gradient-fasting shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all active:scale-95 touch-target"
          >
            Join Challenge
          </button>
        </div>
      {/if}

      <!-- Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {#each [
          { id: 'progress', label: 'My Progress', icon: '📊' },
          { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
          { id: 'food', label: 'Food Log', icon: '🍽️' },
        ] as tab}
          <button
            on:click={() => (activeTab = tab.id)}
            class="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all touch-target {
              activeTab === tab.id 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }"
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        {/each}
      </div>

      <!-- Tab content -->
      <div class="animate-fade-in">
        <!-- Progress Tab -->
        {#if activeTab === 'progress' && challenge.isParticipating}
          <div class="grid lg:grid-cols-2 gap-6">
            <!-- Stats cards -->
            <div class="bg-white rounded-3xl shadow-lg p-6 {mounted ? 'animate-fade-in-up' : 'opacity-0'}">
              <h3 class="font-bold text-gray-900 mb-6">My Stats</h3>
              
              {#if challenge.myProgress}
                <div class="flex items-center justify-center mb-6">
                  <!-- Big progress ring -->
                  <div class="relative">
                    <svg class="w-40 h-40 progress-ring" viewBox="0 0 120 120">
                      <circle 
                        class="progress-ring-track" 
                        cx="60" cy="60" r="54" 
                        fill="none" 
                        stroke-width="10"
                      />
                      <circle 
                        class="progress-ring-fill text-orange-500" 
                        cx="60" cy="60" r="54" 
                        fill="none" 
                        stroke="currentColor"
                        stroke-width="10"
                        stroke-dasharray="{2 * Math.PI * 54}"
                        stroke-dashoffset={getProgressRingPath(challenge.myProgress.completionRate)}
                        style="transition: stroke-dashoffset 1s ease-out"
                      />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                      <span class="text-4xl font-bold text-gray-900">{challenge.myProgress.completionRate}%</span>
                      <span class="text-sm text-gray-500">Complete</span>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div class="text-center p-4 bg-orange-50 rounded-2xl">
                    <div class="text-2xl font-bold text-orange-600">{challenge.myProgress.currentStreak}</div>
                    <div class="text-xs text-gray-600">🔥 Streak</div>
                  </div>
                  <div class="text-center p-4 bg-green-50 rounded-2xl">
                    <div class="text-2xl font-bold text-green-600">{challenge.myProgress.completedDays}</div>
                    <div class="text-xs text-gray-600">Days Done</div>
                  </div>
                  <div class="text-center p-4 bg-blue-50 rounded-2xl">
                    <div class="text-2xl font-bold text-blue-600">{challenge.myProgress.totalDays}</div>
                    <div class="text-xs text-gray-600">Total Days</div>
                  </div>
                </div>
              {:else}
                <p class="text-gray-500 text-center py-8">Complete your first check-in to see stats!</p>
              {/if}
            </div>

            <!-- Calendar -->
            <div class="bg-white rounded-3xl shadow-lg p-6 {mounted ? 'animate-fade-in-up stagger-2' : 'opacity-0'}">
              <h3 class="font-bold text-gray-900 mb-4">Progress Calendar</h3>
              
              <div class="grid grid-cols-7 gap-1 sm:gap-2">
                {#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
                  <div class="text-center text-xs font-medium text-gray-400 py-2">{day}</div>
                {/each}
                
                {#each calendarDays as day, i}
                  {#if day.empty}
                    <div></div>
                  {:else}
                    <div 
                      class="aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all {
                        day.isToday ? 'ring-2 ring-orange-500 ring-offset-2' : ''
                      } {
                        day.completed 
                          ? 'bg-green-500 text-white' 
                          : day.logged 
                            ? 'bg-red-100 text-red-600' 
                            : day.isPast 
                              ? 'bg-gray-100 text-gray-400' 
                              : 'bg-gray-50 text-gray-600'
                      }"
                    >
                      {day.dayOfMonth}
                    </div>
                  {/if}
                {/each}
              </div>
              
              <div class="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-green-500"></span> Done
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-red-100"></span> Missed
                </span>
              </div>
            </div>

            <!-- Weight trend -->
            {#if $healthStore.weightTrend.length > 0}
              <div class="lg:col-span-2 bg-white rounded-3xl shadow-lg p-6 {mounted ? 'animate-fade-in-up stagger-3' : 'opacity-0'}">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-gray-900">⚖️ Weight Trend</h3>
                  {#if $latestWeight}
                    <div class="text-right">
                      <div class="text-2xl font-bold text-gray-900">{$latestWeight.weight} {$latestWeight.unit}</div>
                      <div class="text-xs text-gray-500">Current</div>
                    </div>
                  {/if}
                </div>
                
                <div class="flex items-end justify-between h-24 gap-1">
                  {#each $healthStore.weightTrend.slice(-14) as point, i}
                    {@const min = Math.min(...$healthStore.weightTrend.slice(-14).map(p => p.weight))}
                    {@const max = Math.max(...$healthStore.weightTrend.slice(-14).map(p => p.weight))}
                    {@const range = max - min || 1}
                    {@const height = ((point.weight - min) / range) * 100}
                    <div class="flex-1 flex flex-col items-center gap-1">
                      <div 
                        class="w-full rounded-t-lg bg-gradient-to-t from-orange-400 to-orange-600 transition-all hover:from-orange-500 hover:to-orange-700"
                        style="height: {Math.max(15, height)}%"
                        title="{point.weight} on {point.date}"
                      ></div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Leaderboard Tab -->
        {#if activeTab === 'leaderboard'}
          <div class="bg-white rounded-3xl shadow-lg overflow-hidden {mounted ? 'animate-fade-in-up' : 'opacity-0'}">
            <div class="p-6 border-b border-gray-100">
              <h3 class="font-bold text-gray-900">🏆 Family Leaderboard</h3>
            </div>
            
            {#if participants.length === 0}
              <p class="text-gray-500 text-center py-12">No participants yet</p>
            {:else}
              <div class="divide-y divide-gray-100">
                {#each participants.sort((a, b) => b.progress.completionRate - a.progress.completionRate) as participant, i}
                  <div 
                    class="flex items-center gap-4 p-4 sm:p-5 hover:bg-gray-50 transition-colors {
                      participant.userId === currentUser?.id ? 'bg-orange-50' : ''
                    }"
                  >
                    <!-- Rank -->
                    <div class="w-10 text-center flex-shrink-0">
                      {#if i === 0}
                        <span class="text-3xl">🥇</span>
                      {:else if i === 1}
                        <span class="text-3xl">🥈</span>
                      {:else if i === 2}
                        <span class="text-3xl">🥉</span>
                      {:else}
                        <span class="text-xl font-bold text-gray-400">#{i + 1}</span>
                      {/if}
                    </div>
                    
                    <!-- Avatar -->
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                      <span class="font-bold text-orange-700 text-lg">
                        {participant.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-900 truncate">
                        {participant.user.name}
                        {#if participant.userId === currentUser?.id}
                          <span class="text-xs text-orange-600 ml-1">(You)</span>
                        {/if}
                      </div>
                      <div class="flex items-center gap-3 text-sm text-gray-500">
                        <span>🔥 {participant.progress.currentStreak} streak</span>
                        <span>{participant.progress.completedDays}/{participant.progress.totalDays} days</span>
                      </div>
                    </div>
                    
                    <!-- Score -->
                    <div class="text-right flex-shrink-0">
                      <div class="text-2xl font-bold text-gray-900">{participant.progress.completionRate}%</div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Food Log Tab -->
        {#if activeTab === 'food'}
          <div class="space-y-4">
            <!-- Daily summary -->
            {#if $healthStore.dailySummary}
              <div class="bg-white rounded-3xl shadow-lg p-6 {mounted ? 'animate-fade-in-up' : 'opacity-0'}">
                <h3 class="font-bold text-gray-900 mb-4">Today's Nutrition</h3>
                <div class="grid grid-cols-4 gap-3">
                  <div class="text-center p-3 bg-blue-50 rounded-2xl">
                    <div class="text-xl font-bold text-blue-700">{$healthStore.dailySummary.calories}</div>
                    <div class="text-xs text-gray-600">Calories</div>
                  </div>
                  <div class="text-center p-3 bg-red-50 rounded-2xl">
                    <div class="text-xl font-bold text-red-700">{$healthStore.dailySummary.protein}g</div>
                    <div class="text-xs text-gray-600">Protein</div>
                  </div>
                  <div class="text-center p-3 bg-yellow-50 rounded-2xl">
                    <div class="text-xl font-bold text-yellow-700">{$healthStore.dailySummary.carbs}g</div>
                    <div class="text-xs text-gray-600">Carbs</div>
                  </div>
                  <div class="text-center p-3 bg-green-50 rounded-2xl">
                    <div class="text-xl font-bold text-green-700">{$healthStore.dailySummary.fat}g</div>
                    <div class="text-xs text-gray-600">Fat</div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Food list -->
            <div class="bg-white rounded-3xl shadow-lg overflow-hidden {mounted ? 'animate-fade-in-up stagger-2' : 'opacity-0'}">
              <div class="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 class="font-bold text-gray-900">🍽️ Food Log</h3>
                <button 
                  on:click={() => (showFoodSheet = true)}
                  class="px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                >
                  + Add Food
                </button>
              </div>
              
              {#if $healthStore.foodLogs.length === 0}
                <div class="p-12 text-center">
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <span class="text-3xl">🍽️</span>
                  </div>
                  <p class="text-gray-500">No food logged today</p>
                  <button 
                    on:click={() => (showFoodSheet = true)}
                    class="mt-4 px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
                  >
                    Log Your First Meal
                  </button>
                </div>
              {:else}
                <div class="divide-y divide-gray-100">
                  {#each $healthStore.foodLogs as food, i}
                    <div class="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <div class="font-medium text-gray-900">{food.description}</div>
                          <div class="text-sm text-gray-500 mt-1">
                            {new Date(food.loggedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                        {#if food.calories}
                          <div class="text-right flex-shrink-0">
                            <div class="font-bold text-gray-900">{food.calories} cal</div>
                            <div class="text-xs text-gray-500">
                              {[
                                food.protein ? `${food.protein}P` : '',
                                food.carbs ? `${food.carbs}C` : '',
                                food.fat ? `${food.fat}F` : '',
                              ].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">Challenge not found</p>
  </div>
{/if}

<!-- Check-in Bottom Sheet -->
{#if showCheckInSheet}
  <div class="fixed inset-0 bg-black/50 z-50 animate-fade-in" on:click={() => (showCheckInSheet = false)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showCheckInSheet = false)}></div>
  <div class="bottom-sheet">
    <div class="bottom-sheet-handle"></div>
    <div class="px-6 pb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">📝 Daily Check-in</h2>
        <button on:click={() => (showCheckInSheet = false)} class="p-2 text-gray-400 hover:text-gray-600 rounded-full touch-target">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form on:submit|preventDefault={submitDailyLog} class="space-y-6">
        <!-- Completion toggle -->
        <button
          type="button"
          on:click={() => (logCompleted = !logCompleted)}
          class="w-full p-6 rounded-3xl border-2 transition-all text-left {
            logCompleted 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          }"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full flex items-center justify-center {logCompleted ? 'bg-green-500 text-white' : 'bg-gray-100'}">
              {#if logCompleted}
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              {:else}
                <div class="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
              {/if}
            </div>
            <div>
              <div class="font-bold text-lg text-gray-900">
                {logCompleted ? "Today's goal completed! 🎉" : "Tap to mark complete"}
              </div>
              <div class="text-sm text-gray-500">Did you stick to your fasting schedule?</div>
            </div>
          </div>
        </button>

        <!-- Fasting status -->
        {#if challenge?.type === 'fasting'}
          <div>
            <span class="block text-sm font-medium text-gray-700 mb-3">Current Status</span>
            <div class="grid grid-cols-3 gap-3">
              {#each Object.entries(FASTING_STATUS_LABELS) as [status, info]}
                <button
                  type="button"
                  on:click={() => (logFastingStatus = status)}
                  class="p-4 rounded-2xl border-2 transition-all text-center touch-target {
                    logFastingStatus === status 
                      ? 'border-orange-500 ' + info.color 
                      : 'border-gray-200 hover:border-gray-300'
                  }"
                >
                  <span class="text-2xl block">{info.emoji}</span>
                  <span class="text-sm font-medium">{info.label}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Notes -->
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
          <textarea
            id="notes"
            bind:value={logNotes}
            class="input text-lg"
            rows="2"
            placeholder="How are you feeling today?"
          ></textarea>
        </div>

        <button 
          type="submit" 
          class="w-full py-4 rounded-2xl text-lg font-bold text-white {logCompleted ? 'gradient-feeding' : 'gradient-fasting'} shadow-lg transition-all active:scale-[0.98] touch-target"
          disabled={isSubmittingLog}
        >
          {isSubmittingLog ? '⏳ Saving...' : todayLog ? 'Update Check-in' : 'Submit Check-in'}
        </button>
      </form>
    </div>
  </div>
{/if}

<!-- Food Log Bottom Sheet -->
{#if showFoodSheet}
  <div class="fixed inset-0 bg-black/50 z-50 animate-fade-in" on:click={() => (showFoodSheet = false)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showFoodSheet = false)}></div>
  <div class="bottom-sheet">
    <div class="bottom-sheet-handle"></div>
    <div class="px-6 pb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">🍽️ Log Food</h2>
        <button on:click={() => (showFoodSheet = false)} class="p-2 text-gray-400 hover:text-gray-600 rounded-full touch-target">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form on:submit|preventDefault={submitFoodLog} class="space-y-4">
        <div>
          <label for="foodDesc" class="block text-sm font-medium text-gray-700 mb-2">What did you eat?</label>
          <input
            type="text"
            id="foodDesc"
            bind:value={foodDescription}
            class="input text-lg"
            placeholder="e.g., Grilled chicken salad"
            required
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="food-calories" class="block text-xs font-medium text-gray-500 mb-1">Calories</label>
            <input type="number" id="food-calories" bind:value={foodCalories} class="input" placeholder="500" />
          </div>
          <div>
            <label for="food-protein" class="block text-xs font-medium text-gray-500 mb-1">Protein (g)</label>
            <input type="number" id="food-protein" bind:value={foodProtein} class="input" placeholder="30" />
          </div>
          <div>
            <label for="food-carbs" class="block text-xs font-medium text-gray-500 mb-1">Carbs (g)</label>
            <input type="number" id="food-carbs" bind:value={foodCarbs} class="input" placeholder="25" />
          </div>
          <div>
            <label for="food-fat" class="block text-xs font-medium text-gray-500 mb-1">Fat (g)</label>
            <input type="number" id="food-fat" bind:value={foodFat} class="input" placeholder="15" />
          </div>
        </div>

        <button 
          type="submit" 
          class="w-full py-4 rounded-2xl text-lg font-bold text-white gradient-feeding shadow-lg transition-all active:scale-[0.98] touch-target"
        >
          Log Food
        </button>
      </form>
    </div>
  </div>
{/if}

<!-- Weight Log Bottom Sheet -->
{#if showWeightSheet}
  <div class="fixed inset-0 bg-black/50 z-50 animate-fade-in" on:click={() => (showWeightSheet = false)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showWeightSheet = false)}></div>
  <div class="bottom-sheet">
    <div class="bottom-sheet-handle"></div>
    <div class="px-6 pb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">⚖️ Log Weight</h2>
        <button on:click={() => (showWeightSheet = false)} class="p-2 text-gray-400 hover:text-gray-600 rounded-full touch-target">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form on:submit|preventDefault={submitWeightLog} class="space-y-6">
        <div class="text-center">
          <label for="weight-value" class="block text-sm font-medium text-gray-500 mb-2">Weight (lbs)</label>
          <input
            type="number"
            id="weight-value"
            bind:value={weightValue}
            class="w-full text-center text-5xl font-bold py-6 border-2 border-gray-200 rounded-3xl focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="150"
            step="0.1"
            required
          />
        </div>

        <div>
          <label for="weight-notes" class="block text-sm font-medium text-gray-500 mb-2">Notes (optional)</label>
          <input
            type="text"
            id="weight-notes"
            bind:value={weightNotes}
            class="input"
            placeholder="Morning weigh-in"
          />
        </div>

        <button 
          type="submit" 
          class="w-full py-4 rounded-2xl text-lg font-bold text-white gradient-fasting shadow-lg transition-all active:scale-[0.98] touch-target"
        >
          Log Weight
        </button>
      </form>
    </div>
  </div>
{/if}

<style>
  @keyframes confetti {
    0% {
      opacity: 1;
      transform: translateY(0) rotate(0deg);
    }
    100% {
      opacity: 0;
      transform: translateY(100vh) rotate(720deg);
    }
  }
</style>
