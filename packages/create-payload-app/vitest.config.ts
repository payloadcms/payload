import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    testTimeout: 160000,
  },
})
