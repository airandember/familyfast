<script lang="ts">
	import { goto } from '$app/navigation';
	
	// Redirect to dashboard since families are shown there
	goto('/dashboard');
</script>

<div class="flex items-center justify-center min-h-[50vh]">
	<p class="text-gray-600">Redirecting...</p>
</div>
