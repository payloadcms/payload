import { fileURLToPath } from 'url'

import { test } from '../__helpers/int/vitest.js'

test.suite({ config: './config.ts' })('@payloadcms/plugin-sentry', () => {
  test.describe('tests', () => {
    test.todo('plugin-sentry tests')
  })
})
