<script lang="ts">
  import "temporal-polyfill/global"
  import {
    createExpense,
    todayISO,
    CURRENCIES,
  } from "./lib.ts"
  import type { Currency } from "./lib.ts"

  let { password }: { password: string } = $props()

  const currencyKeys = Object.keys(CURRENCIES) as Currency[]

  let what = $state("")
  let amount = $state("")
  let currency: Currency = $state(currencyKeys[0])
  let when = $state(todayISO())

  let submitting = $state(false)
  let error = $state("")
  let successMessage = $state("")

  function handleSubmit(e: Event): void {
    e.preventDefault()
    error = ""
    successMessage = ""

    if (!what.trim()) {
      error = "Please enter a description."
      return
    }
    const parsedAmount = Number(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount === 0 || Object.is(parsedAmount, -0)) {
      error = "Please enter a valid amount (non-zero)."
      return
    }

    submitting = true
    createExpense(password, {
      what: what.trim(),
      amount: parsedAmount,
      currency,
      timestamp: `${when}T00:00:00Z`,
    })
      .then(() => {
        submitting = false
        successMessage = "Expense saved!"
        // Reset form fields
        what = ""
        amount = ""
        when = todayISO()
      })
      .catch((err: unknown) => {
        error = String(err)
        submitting = false
      })
  }
</script>

{#if error}
  <div class="mb-8 rounded-lg border-2 border-zag-error-light/50 dark:border-zag-error-dark/50 bg-zag-error-light/10 dark:bg-zag-error-dark/10 p-4 text-center">
    <p class="font-medium">Some error occurred! Please try again later.</p>
    <p>{error}</p>
  </div>
{/if}

{#if successMessage}
  <div class="mb-8 rounded-lg border-2 border-zag-accent-light/50 dark:border-zag-accent-dark/50 bg-zag-accent-light/10 dark:bg-zag-accent-dark/10 p-4 text-center">
    <p class="font-medium">{successMessage}</p>
  </div>
{/if}

<form onsubmit={handleSubmit} class="max-w-lg mx-auto space-y-6">
  <div class="space-y-1">
    <label for="new-what" class="font-medium text-sm sm:text-base">What</label>
    <input
      type="text"
      id="new-what"
      bind:value={what}
      placeholder="e.g. Grocery shopping"
      class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition placeholder:zag-muted focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
    />
  </div>

  <div class="grid grid-cols-[30%_70%] gap-2 items-center">
    <label for="new-amount" class="font-medium text-sm sm:text-base">Amount</label>
    <input
      type="number"
      id="new-amount"
      step="0.01"
      bind:value={amount}
      placeholder="0.00"
      class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition placeholder:zag-muted focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
    />
  </div>

  <div class="grid grid-cols-[30%_70%] gap-2 items-center">
    <label for="new-when" class="font-medium text-sm sm:text-base">When</label>
    <input
      type="date"
      id="new-when"
      bind:value={when}
      class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
    />
  </div>

  <div class="space-y-1">
    <span class="font-medium text-sm sm:text-base">Currency</span>
    <div class="flex flex-wrap gap-4 pt-2">
      {#each currencyKeys as cur}
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="currency"
            value={cur}
            bind:group={currency}
            class="h-4 w-4 cursor-pointer"
          />
          <span class="text-xl">{CURRENCIES[cur]}</span>
          <span class="font-mono text-sm">{cur}</span>
        </label>
      {/each}
    </div>
  </div>

  <div class="pt-2">
    <button
      type="submit"
      disabled={submitting}
      class="rounded-lg border-2 border-zag-accent-light dark:border-zag-accent-dark bg-zag-accent-light dark:bg-zag-accent-dark px-6 py-2.5 font-mono font-medium text-sm sm:text-base zag-transition cursor-pointer hover:opacity-80 focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {submitting ? "Sending…" : "Send"}
    </button>
  </div>
</form>
