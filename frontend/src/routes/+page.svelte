<script lang="ts">
	import { isAuthenticated } from '$lib/stores/auth';
</script>

<svelte:head>
	<title>FamilyFast - Connect Your Family</title>
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden">
	<!-- Background decorations -->
	<div class="absolute inset-0 -z-10">
		<div class="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
		<div class="absolute top-40 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
		<div class="absolute -bottom-8 left-20 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
		<div class="text-center max-w-4xl mx-auto">
			<h1 class="font-display text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
				Bring Your Family
				<span class="text-gradient">Closer Together</span>
			</h1>
			<p class="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
				Share health goals, celebrate milestones, tackle challenges, and stay connected with the people who matter most.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				{#if $isAuthenticated}
					<a href="/dashboard" class="btn-primary text-lg px-8 py-4">
						Go to Dashboard
					</a>
				{:else}
					<a href="/register" class="btn-primary text-lg px-8 py-4">
						Start Free Today
					</a>
					<a href="/login" class="btn-outline text-lg px-8 py-4">
						Sign In
					</a>
				{/if}
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="py-24 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-16">
			<h2 class="font-display text-4xl font-bold text-gray-900 mb-4">
				Everything Your Family Needs
			</h2>
			<p class="text-xl text-gray-600 max-w-2xl mx-auto">
				One platform to keep your family connected, healthy, and engaged
			</p>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
			<!-- Feature 1 -->
			<div class="card-hover group">
				<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
					<svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</div>
				<h3 class="font-display text-xl font-bold text-gray-900 mb-2">Family Groups</h3>
				<p class="text-gray-600">Create private spaces for your family. Invite members with a simple link and manage who sees what.</p>
			</div>

			<!-- Feature 2 -->
			<div class="card-hover group">
				<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
					<svg class="w-7 h-7 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
					</svg>
				</div>
				<h3 class="font-display text-xl font-bold text-gray-900 mb-2">Health Tracking</h3>
				<p class="text-gray-600">Share health goals, track progress together, and support each other on the journey to better health.</p>
			</div>

			<!-- Feature 3 -->
			<div class="card-hover group">
				<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
					<svg class="w-7 h-7 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
					</svg>
				</div>
				<h3 class="font-display text-xl font-bold text-gray-900 mb-2">Milestones</h3>
				<p class="text-gray-600">Never miss a birthday, anniversary, or achievement. Celebrate life's moments together.</p>
			</div>

			<!-- Feature 4 -->
			<div class="card-hover group">
				<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
					<svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
					</svg>
				</div>
				<h3 class="font-display text-xl font-bold text-gray-900 mb-2">Challenges</h3>
				<p class="text-gray-600">Create fun family challenges. Who can walk the most steps? Best recipe of the week?</p>
			</div>

			<!-- Feature 5 -->
			<div class="card-hover group">
				<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
					<svg class="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
				</div>
				<h3 class="font-display text-xl font-bold text-gray-900 mb-2">Recipe Sharing</h3>
				<p class="text-gray-600">Pass down family recipes, share new discoveries, and plan meals together.</p>
			</div>

			<!-- Feature 6 -->
			<div class="card-hover group">
				<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
					<svg class="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
				<h3 class="font-display text-xl font-bold text-gray-900 mb-2">Discussion Feeds</h3>
				<p class="text-gray-600">Stay in touch with a private family feed. Share updates, photos, and keep everyone in the loop.</p>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-24">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="card bg-gradient-to-br from-primary-500 to-accent-600 text-white text-center py-12 px-8">
			<h2 class="font-display text-3xl md:text-4xl font-bold mb-4">
				Ready to bring your family closer?
			</h2>
			<p class="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
				Join thousands of families already using FamilyFast to stay connected and engaged.
			</p>
			{#if !$isAuthenticated}
				<a href="/register" class="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-8 py-4 rounded-lg hover:bg-primary-50 transition-colors">
					Get Started Free
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</a>
			{/if}
		</div>
	</div>
</section>

<style>
	@keyframes blob {
		0% { transform: translate(0px, 0px) scale(1); }
		33% { transform: translate(30px, -50px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.9); }
		100% { transform: translate(0px, 0px) scale(1); }
	}
	
	.animate-blob {
		animation: blob 7s infinite;
	}
	
	.animation-delay-2000 {
		animation-delay: 2s;
	}
	
	.animation-delay-4000 {
		animation-delay: 4s;
	}
</style>
