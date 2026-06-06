<script lang="ts">
  import "temporal-polyfill/global"
  import { fetchUsage, formatTimestamp, formatRelativeUntil } from "./lib.ts"
  import type { UsageService } from "./lib.ts"

  let data = $state<Awaited<ReturnType<typeof fetchUsage>> | null>(null)
  let loading = $state(false)
  let error = $state("")
  let mounted = $state(false)

  function load(): void {
    loading = true
    error = ""
    fetchUsage()
      .then((response) => {
        data = response
        loading = false
      })
      .catch((err: unknown) => {
        error = String(err)
        loading = false
      })
  }

  /** Clamp a percentage into a valid 0–100 range for the progress bar width. */
  function percentWidth(svc: UsageService): number {
    return Math.min(100, Math.max(0, svc.percentage ?? 0))
  }

  /** Services with high quota usage are highlighted in the error color. */
  function isHighUsage(svc: UsageService): boolean {
    return typeof svc.percentage === "number" && (svc.percentage ?? 0) >= 80
  }

  // Client-only initialization — fetch the live data on mount.
  $effect(() => {
    if (typeof window === "undefined") return
    if (mounted) return
    mounted = true
    load()
  })
</script>

{#if !mounted || (loading && !data)}
  <div class="flex justify-center py-12">
    <svg
      class="animate-spin h-8 w-8 zag-muted"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
{:else if error}
  <div
    class="space-y-3 rounded-lg border-2 border-zag-error-light/50 dark:border-zag-error-dark/50 bg-zag-error-light/10 dark:bg-zag-error-dark/10 p-4 text-center"
  >
    <p class="font-medium">Something went wrong while loading usage data.</p>
    <p class="zag-muted text-sm break-words">{error}</p>
    <button
      onclick={load}
      class="rounded-lg border-2 border-zag-accent-light dark:border-zag-accent-dark bg-zag-accent-light dark:bg-zag-accent-dark px-4 py-2 font-mono font-medium text-sm -zag-text zag-transition cursor-pointer hover:opacity-80 focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
    >
      Retry
    </button>
  </div>
{:else if data}
  <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <p class="zag-muted text-sm">
      Last updated: {formatTimestamp(data.timestamp)}
    </p>
    <button
      onclick={load}
      disabled={loading}
      class="rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 px-4 py-1.5 font-mono text-sm zag-text zag-transition cursor-pointer hover:opacity-80 focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Refreshing…" : "Refresh"}
    </button>
  </div>

  <div class="space-y-4">
    {#each data.services as svc (svc.service)}
      {@const isPercent = typeof svc.percentage === "number"}
      {@const isBalance = typeof svc.balance === "number"}
      {@const high = isHighUsage(svc)}
      <div class="rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 p-4 sm:p-5">
        <div class="mb-3 flex items-baseline justify-between gap-4">
          <h2 class="text-lg sm:text-xl font-semibold">{svc.service}</h2>
          {#if isPercent}
            <span class="font-mono text-base sm:text-lg {high ? "text-zag-error-light dark:text-zag-error-dark" : ""}">
              {svc.percentage}%
            </span>
          {/if}
        </div>

        {#if isPercent}
          <div
            class="h-3 rounded-full bg-zag-dark/10 dark:bg-zag-light/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={svc.percentage}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`${svc.service} usage`}
          >
            <div
              class="h-full rounded-full zag-transition {high ? "bg-zag-error-light dark:bg-zag-error-dark" : "bg-zag-accent-light dark:bg-zag-accent-dark"}"
              style={`width: ${percentWidth(svc)}%`}
            ></div>
          </div>
          {#if svc.reset_at}
            <p class="zag-muted mt-2 text-sm">
              Resets in {formatRelativeUntil(svc.reset_at)}
            </p>
          {/if}
        {:else if isBalance}
          <p class="font-mono text-2xl sm:text-3xl font-semibold">
            <span class="zag-muted">$</span>{svc.balance?.toFixed(2)}
            <span class="zag-muted text-base font-normal"> remaining</span>
          </p>
        {/if}
      </div>
    {/each}
  </div>
{/if}
