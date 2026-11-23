import { defineConfig } from 'vitest/config'

import { prepareUpgradeSources } from '../../tools/upgrade/prepare.mjs'

prepareUpgradeSources({ packages: ['create-payload-app'] })

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
  },
})
