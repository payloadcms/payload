import { expect } from 'vitest'

import { afterAll, beforeAll, suite, test } from './vitest.js'

suite('integration config fixture', { config: './configImport.config.ts' }, () => {
  beforeAll(() => {
    expect(process.env.PAYLOAD_TEST_CONFIG_IMPORTED).toBe('true')
  })

  afterAll(() => {
    delete process.env.PAYLOAD_TEST_CONFIG_IMPORTED
  })

  test('keeps the automatically imported config available to tests', () => {
    expect(process.env.PAYLOAD_TEST_CONFIG_IMPORTED).toBe('true')
  })
})
