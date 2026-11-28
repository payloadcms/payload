import { afterAll, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { storageR2Tests } from './storageR2Tests.js'

// Older versions of the adapter checked NODE_ENV when they loaded and took a different path in
// development, which the default `test` run never reaches. Set it before the config imports the
// adapter.
vi.hoisted(() => {
  vi.stubEnv('NODE_ENV', 'development')
})

afterAll(() => {
  vi.unstubAllEnvs()
})

test.suite(
  '@payloadcms/storage-r2 with NODE_ENV=development',
  { config: './config.ts' },
  storageR2Tests,
)
