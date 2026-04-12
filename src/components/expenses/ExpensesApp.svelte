<script lang="ts">
  import "temporal-polyfill/global"
  import { loadPassword, savePassword, listExpenses, startOfMonthISO, tomorrowISO } from "./lib.ts"
  import ExpenseList from "./ExpenseList.svelte"
  import DraftManager from "./DraftManager.svelte"
  import NewExpense from "./NewExpense.svelte"

  type View = "list" | "drafts" | "new"

  const VALID_VIEWS: View[] = ["list", "drafts", "new"]
  const PARAM_KEY = "view"

  let password = $state("")
  let authError = $state("")
  let authenticated = $state(false)

  let currentView: View = $state("list")

  function readViewFromURL(): View {
    const params = new URLSearchParams(window.location.search)
    const v = params.get(PARAM_KEY)
    if (v && VALID_VIEWS.includes(v as View)) return v as View
    return "list"
  }

  function pushViewToURL(view: View): void {
    const url = new URL(window.location.href)
    if (view === "list") {
      url.searchParams.delete(PARAM_KEY)
    } else {
      url.searchParams.set(PARAM_KEY, view)
    }
    history.replaceState(null, "", url.toString())
  }
  let mounted = $state(false)

  let expenseListRef: ExpenseList | undefined = $state()
  let draftManagerRef: DraftManager | undefined = $state()

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
      .then(() => {
        savePassword(password)
        authenticated = true
      })
      .catch((err: unknown) => {
        authError = String(err)
      })
  }

  function handleLoginKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") handleLogin()
  }

  function switchView(view: View): void {
    currentView = view
    pushViewToURL(view)
    // Trigger child component init after they mount
    setTimeout(() => {
      if (view === "list" && expenseListRef) expenseListRef.init()
      if (view === "drafts" && draftManagerRef) draftManagerRef.init()
    }, 0)
  }

  // Client-only initialization
  $effect(() => {
    if (typeof window === "undefined") return
    if (mounted) return
    mounted = true

    currentView = readViewFromURL()

    const saved = loadPassword()
    if (saved) {
      password = saved
      authenticated = true
    }
  })

  // Init default view after auth is established
  $effect(() => {
    if (authenticated && expenseListRef) {
      expenseListRef.init()
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
  <!-- View navigation -->
  <nav class="flex justify-center gap-2 sm:gap-4 mb-8">
    <button
      onclick={() => switchView("list")}
      class="rounded-lg px-4 py-2 font-mono font-medium text-sm sm:text-base zag-transition cursor-pointer hover:opacity-80 {currentView === 'list' ? 'border-2 border-zag-accent-light dark:border-zag-accent-dark bg-zag-accent-light dark:bg-zag-accent-dark' : 'border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent zag-text'}"
    >
      List
    </button>
    <button
      onclick={() => switchView("drafts")}
      class="rounded-lg px-4 py-2 font-mono font-medium text-sm sm:text-base zag-transition cursor-pointer hover:opacity-80 {currentView === 'drafts' ? 'border-2 border-zag-accent-light dark:border-zag-accent-dark bg-zag-accent-light dark:bg-zag-accent-dark' : 'border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent zag-text'}"
    >
      Drafts
    </button>
    <button
      onclick={() => switchView("new")}
      class="rounded-lg px-4 py-2 font-mono font-medium text-sm sm:text-base zag-transition cursor-pointer hover:opacity-80 {currentView === 'new' ? 'border-2 border-zag-accent-light dark:border-zag-accent-dark bg-zag-accent-light dark:bg-zag-accent-dark' : 'border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent zag-text'}"
    >
      New Expense
    </button>
  </nav>

  <!-- View content -->
  {#if currentView === "list"}
    <ExpenseList bind:this={expenseListRef} {password} />
  {:else if currentView === "drafts"}
    <DraftManager bind:this={draftManagerRef} {password} />
  {:else if currentView === "new"}
    <NewExpense {password} />
  {/if}
{/if}
