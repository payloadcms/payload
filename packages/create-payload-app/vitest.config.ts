import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['../../tools/releaser/scripts/setup-package-lists.mjs'],
    include: ['src/**/*.spec.ts'],
  },
})
