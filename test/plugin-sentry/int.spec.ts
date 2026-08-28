import { fileURLToPath } from 'url'

import { test } from '../__helpers/int/vitest.js'
import testConfig from './config.js'

test.suite({ config: testConfig })('@payloadcms/plugin-sentry', () => {
  test.describe('tests', () => {
    test.todo('plugin-sentry tests')
  })
})
