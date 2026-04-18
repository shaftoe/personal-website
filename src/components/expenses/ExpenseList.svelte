<script lang="ts">
  import { listExpenses, formatLocaleDate } from "./lib.ts"
  import type { Expense } from "./lib.ts"
  import FilterForm from "./FilterForm.svelte"

  let { password }: { password: string } = $props()

  let from = $state("")
  let to = $state("")
  let filter = $state("")

  let expenses: Expense[] = $state([])
  let loading = $state(false)
  let error = $state("")

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

  function handleFilterKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") doFetch()
  }

  export function init(): void {
    from = from || startOfMonthISO()
    to = to || tomorrowISO()
    doFetch()
  }

  function startOfMonthISO(): string {
    const now = Temporal.Now.zonedDateTimeISO().toPlainDateTime()
    return Temporal.PlainDate.from({
      year: now.year,
      month: now.month,
      day: 1,
    }).toString()
  }

  function tomorrowISO(): string {
    return Temporal.Now.zonedDateTimeISO()
      .toPlainDateTime()
      .add(Temporal.Duration.from({ days: 1 }))
      .toPlainDate()
      .toString()
  }
</script>

{#if error}
  <div class="mb-8 rounded-lg border-2 border-zag-error-light/50 dark:border-zag-error-dark/50 bg-zag-error-light/10 dark:bg-zag-error-dark/10 p-4 text-center">
    <p class="font-medium">Some error occurred! Please try again later.</p>
    <p>{error}</p>
  </div>
{/if}

<FilterForm
  prefix="list"
  bind:from
  bind:to
  bind:filter
  onchange={doFetch}
  onfilterkeydown={handleFilterKeydown}
/>

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
          <td class="py-2 px-2">TOTAL USD {totalUSD}</td>
        </tr>
      </tfoot>
    </table>
  </div>
{/if}
