<script lang="ts">
  import {
    loadPassword,
    savePassword,
    listExpenses,
    startOfMonthISO,
    tomorrowISO,
    formatLocaleDate,
  } from "./lib.ts"
  import type { Expense } from "./lib.ts"

  let password = $state("")
  let authError = $state("")
  let authenticated = $state(false)

  let from = $state("")
  let to = $state("")
  let filter = $state("")

  let expenses: Expense[] = $state([])
  let loading = $state(false)
  let error = $state("")
  let mounted = $state(false)

  let totalUSD = $derived(
    expenses.reduce((sum, e) => sum + e.usd, 0).toFixed(2),
  )

  function doFetch(): void {
    loading = true
    error = ""
    listExpenses({
      password,
      from,
      to,
      filter: filter || undefined,
    })
      .then((data) => {
        expenses = data.expenses
        loading = false
      })
      .catch((err: unknown) => {
        error = String(err)
        loading = false
      })
  }

  function handleLogin(): void {
    authError = ""
    if (!password.trim()) {
      authError = "Please enter a password."
      return
    }
    listExpenses({
      password,
      from: startOfMonthISO(),
      to: tomorrowISO(),
    })
      .then((data) => {
        savePassword(password)
        authenticated = true
        from = startOfMonthISO()
        to = tomorrowISO()
        expenses = data.expenses
      })
      .catch((err: unknown) => {
        authError = String(err)
      })
  }

  function handleLoginKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") handleLogin()
  }

  function handleFilterKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") doFetch()
  }

  // Client-only initialization
  $effect(() => {
    if (typeof window === "undefined") return
    if (mounted) return
    mounted = true

    from = startOfMonthISO()
    to = tomorrowISO()

    const saved = loadPassword()
    if (saved) {
      password = saved
      authenticated = true
      doFetch()
    }
  })
</script>

{#if !mounted}
  <!-- SSR placeholder -->
  <div class="text-center space-y-6">
    <p class="zag-muted">Loading…</p>
  </div>
{:else if !authenticated}
  <!-- Auth gate -->
  <div class="text-center space-y-6">
    <p class="zag-muted">This page is password-protected.</p>
    <div class="max-w-sm mx-auto space-y-4">
      <input
        type="password"
        bind:value={password}
        onkeydown={handleLoginKeydown}
        placeholder="Password"
        class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition placeholder:zag-muted focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
      />
      <button
        onclick={handleLogin}
        class="rounded-lg border-2 border-zag-accent-light dark:border-zag-accent-dark bg-zag-accent-light dark:bg-zag-accent-dark px-6 py-2.5 font-mono font-medium text-sm sm:text-base zag-transition cursor-pointer hover:opacity-80 focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
      >
        Unlock
      </button>
    </div>
    {#if authError}
      <p class="text-red-500 text-sm">{authError}</p>
    {/if}
  </div>
{:else}
  <!-- Main expenses view -->
  {#if error}
    <div class="mb-8 rounded-lg border-2 border-zag-error-light/50 dark:border-zag-error-dark/50 bg-zag-error-light/10 dark:bg-zag-error-dark/10 p-4 text-center">
      <p class="font-medium">Some error occurred! Please try again later.</p>
      <p>{error}</p>
    </div>
  {/if}

  <div class="space-y-4 mb-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="grid grid-cols-[30%_70%] gap-2 items-center">
        <label for="from" class="font-medium text-sm sm:text-base">From</label>
        <input
          type="date"
          id="from"
          bind:value={from}
          onchange={doFetch}
          class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
        />
      </div>
      <div class="grid grid-cols-[30%_70%] gap-2 items-center">
        <label for="to" class="font-medium text-sm sm:text-base">To</label>
        <input
          type="date"
          id="to"
          bind:value={to}
          onchange={doFetch}
          class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="grid grid-cols-[30%_70%] gap-2 items-center">
        <label for="filter" class="font-medium text-sm sm:text-base">Filter</label>
        <input
          type="text"
          id="filter"
          bind:value={filter}
          onkeydown={handleFilterKeydown}
          placeholder="description filter..."
          class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition placeholder:zag-muted focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
        />
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center py-8">
      <svg class="animate-spin h-8 w-8 zag-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="expenses-table w-full text-sm sm:text-base">
        <thead>
          <tr class="border-b-2 border-zag-dark/20 dark:border-zag-light/20">
            <th class="py-2 px-2 text-left font-medium zag-muted">date</th>
            <th class="py-2 px-2 text-left font-medium zag-muted">what</th>
            <th class="py-2 px-2 text-left font-medium zag-muted hidden sm:table-cell">amount</th>
            <th class="py-2 px-2 text-left font-medium zag-muted hidden sm:table-cell">currency</th>
            <th class="py-2 px-2 text-left font-medium zag-muted">usd</th>
          </tr>
        </thead>
        <tbody>
          {#each expenses as expense}
            <tr>
              <td class="py-1 px-2">{formatLocaleDate(expense.timestamp)}</td>
              <td class="py-1 px-2">{expense.what}</td>
              <td class="py-1 px-2 hidden sm:table-cell">{expense.amount.toFixed(2)}</td>
              <td class="py-1 px-2 hidden sm:table-cell">{expense.currency}</td>
              <td class="py-1 px-2">{expense.usd.toFixed(2)}</td>
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-zag-dark/30 dark:border-zag-light/30 font-semibold">
            <td class="py-2 px-2"></td>
            <td class="py-2 px-2"></td>
            <td class="py-2 px-2 hidden sm:table-cell"></td>
            <td class="py-2 px-2 hidden sm:table-cell"></td>
            <td class="py-2 px-2 text-right">TOTAL USD</td>
            <td class="py-2 px-2">{totalUSD}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  {/if}
{/if}
