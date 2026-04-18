<script lang="ts">
  let {
    prefix,
    from = $bindable(),
    to = $bindable(),
    filter = $bindable(),
    onchange,
    onfilterkeydown,
  }: {
    prefix: string
    from: string
    to: string
    filter: string
    onchange: () => void
    onfilterkeydown: (e: KeyboardEvent) => void
  } = $props()
</script>

<div class="space-y-4 mb-8">
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="grid grid-cols-[auto_1fr] gap-2 items-center">
      <label for="{prefix}-from" class="font-medium text-sm sm:text-base">From</label>
      <div class="min-w-0">
        <input
          type="date"
          id="{prefix}-from"
          bind:value={from}
          {onchange}
          class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
        />
      </div>
    </div>
    <div class="grid grid-cols-[auto_1fr] gap-2 items-center">
      <label for="{prefix}-to" class="font-medium text-sm sm:text-base">To</label>
      <div class="min-w-0">
        <input
          type="date"
          id="{prefix}-to"
          bind:value={to}
          {onchange}
          class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
        />
      </div>
    </div>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="grid grid-cols-[auto_1fr] gap-2 items-center">
      <label for="{prefix}-filter" class="font-medium text-sm sm:text-base">Filter</label>
      <div class="min-w-0">
        <input
          type="text"
          id="{prefix}-filter"
          bind:value={filter}
          onkeydown={onfilterkeydown}
          placeholder="description filter..."
          class="w-full rounded-lg border-2 border-zag-dark/20 dark:border-zag-light/20 bg-transparent px-4 py-2 font-mono text-sm sm:text-base zag-text zag-transition placeholder:zag-muted focus:outline-2 focus:outline-offset-2 focus:outline-zag-accent-light dark:focus:outline-zag-accent-dark"
        />
      </div>
    </div>
  </div>
</div>
