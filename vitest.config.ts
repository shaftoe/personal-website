import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Mirrors the former bun test timeout for network-dependent suites.
    testTimeout: 20000,
  },
})
