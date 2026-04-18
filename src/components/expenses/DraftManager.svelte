<script lang="ts">
  import "temporal-polyfill/global"
  import {
    listDrafts,
    batchUpdateDrafts,
    startOfMonthISO,
    tomorrowISO,
    formatLocaleDate,
  } from "./lib.ts"
  import { CURRENCIES } from "./lib.ts"
  import type { DraftExpense, Currency } from "./lib.ts"
  import FilterForm from "./FilterForm.svelte"

  let { password }: { password: string } = $props()

  const currencyKeys = Object.keys(CURRENCIES) as Currency[]

  let from = $state("")
  let to = $state("")
  let filter = $state("")

  let drafts: DraftExpense[] = $state([])
  let loading = $state(false)
  let saving = $state(false)
  let error = $state("")
  let successMessage = $state("")

  // Track edits and deletions separately from the loaded data
  let editedDrafts = $state<Map<number, DraftExpense>>(new Map())
  let deletedIds = $state<Set<number>>(new Set())

  function doFetch(): void {
    loading = true
    error = ""
    successMessage = ""
    editedDrafts = new Map()
    deletedIds = new Set()
    listDrafts({
      password,
      from,
      to,
      filter: filter || undefined,
    })
      .then((data) => {
        drafts = data.expenses
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

  function updateField(id: number, field: keyof DraftExpense, value: string | number): void {
    const original = drafts.find((d) => d.id === id)
    if (!original) return

    const edited = editedDrafts.get(id) ?? { ...original }
    edited[field] = value as never
    editedDrafts.set(id, edited)
    // Trigger reactivity
    editedDrafts = new Map(editedDrafts)
  }

  function toggleDelete(id: number): void {
    const next = new Set(deletedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    deletedIds = next
  }

  function getDraftValue(id: number, field: keyof DraftExpense): string | number {
    const edited = editedDrafts.get(id)
    if (edited) return edited[field]
    const original = drafts.find((d) => d.id === id)
    return original ? original[field] : ""
  }

  function handleBatchUpdate(): void {
    const updates: DraftExpense[] = []
    for (const draft of drafts) {
      if (!deletedIds.has(draft.id)) {
        const edited = editedDrafts.get(draft.id)
        updates.push(edited ?? draft)
      }
    }
    const deletes: DraftExpense[] = []
    for (const id of deletedIds) {
      // Send full draft object — the API validates all fields even for DELETE
      const edited = editedDrafts.get(id)
      const original = drafts.find((d) => d.id === id)
      if (edited) deletes.push(edited)
      else if (original) deletes.push(original)
    }

    if (updates.length === 0 && deletes.length === 0) {
      successMessage = "Nothing to update."
      return
    }

    saving = true
    error = ""
    successMessage = ""
    batchUpdateDrafts(password, updates, deletes)
      .then(() => {
        saving = false
        successMessage = `Saved ${updates.length} draft(s) as expense(s), deleted ${deletes.length} draft(s).`
        doFetch()
      })
      .catch((err: unknown) => {
        error = String(err)
        saving = false
      })
  }

  export function init(): void {
    from = from || startOfMonthISO()
    to = to || tomorrowISO()
    doFetch()
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

<FilterForm
  prefix="draft"
  bind:from
  bind:to
  bind:filter
  onchange={doFetch}
  onfilterkeydown={handleFilterKeydown}
/>

{#if loading || saving}
  <div class="flex justify-center py-8">
    <svg class="animate-spin h-8 w-8 zag-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
{:else if drafts.length === 0}
  <p class="text-center zag-muted py-8">No drafts found in this date range.</p>
{:else}
  <div class="overflow-x-auto">
    <table class="drafts-table w-full text-sm sm:text-base">
      <thead>
        <tr class="border-b-2 border-zag-dark/20 dark:border-zag-light/20">
          <th class="py-2 px-2 text-left font-medium zag-muted">id</th>
          <th class="py-2 px-2 text-left font-medium zag-muted">date</th>
          <th class="py-2 px-2 text-left font-medium zag-muted">what</th>
          <th class="py-2 px-2 text-left font-medium zag-muted hidden sm:table-cell">amount</th>
          <th class="py-2 px-2 text-left font-medium zag-muted hidden sm:table-cell">currency</th>
          <th class="py-2 px-2 text-left font-medium zag-muted">delete</th>
        </tr>
      </thead>
      <tbody>
        {#each drafts as draft (draft.id)}
          {@const isDeleted = deletedIds.has(draft.id)}
          <tr class:opacity-50={isDeleted} class:line-through={isDeleted}>
            <td class="py-1 px-2">{draft.id}</td>
            <td class="py-1 px-2">{formatLocaleDate(draft.timestamp)}</td>
            <td class="py-1 px-2">
              <input
                type="text"
                value={getDraftValue(draft.id, "what")}
                oninput={(e) => updateField(draft.id, "what", (e.target as HTMLInputElement).value)}
                class="w-full rounded border border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-2 py-1 font-mono text-sm zag-text zag-transition focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
              />
            </td>
            <td class="py-1 px-2 hidden sm:table-cell">
              <input
                type="number"
                step="0.01"
                value={getDraftValue(draft.id, "amount")}
                oninput={(e) => updateField(draft.id, "amount", Number((e.target as HTMLInputElement).value))}
                class="w-24 rounded border border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-2 py-1 font-mono text-sm zag-text zag-transition focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
              />
            </td>
            <td class="py-1 px-2 hidden sm:table-cell">
              <select
                value={getDraftValue(draft.id, "currency")}
                onchange={(e) => updateField(draft.id, "currency", (e.target as HTMLSelectElement).value)}
                class="rounded border border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-2 py-1 font-mono text-sm zag-text zag-transition focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
              >
                {#each currencyKeys as cur}
                  <option value={cur}>{cur}</option>
                {/each}
              </select>
            </td>
            <td class="py-1 px-2 text-center">
              <input
                type="checkbox"
                checked={isDeleted}
                onchange={() => toggleDelete(draft.id)}
                class="h-4 w-4 cursor-pointer"
              />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="flex justify-end pt-4">
    <button
      onclick={handleBatchUpdate}
      class="rounded-lg border-2 border-zag-accent-light dark:border-zag-accent-dark bg-zag-accent-light dark:bg-zag-accent-dark px-6 py-2.5 font-mono font-medium text-sm sm:text-base zag-transition cursor-pointer hover:opacity-80 focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
    >
      Update
    </button>
  </div>
{/if}
