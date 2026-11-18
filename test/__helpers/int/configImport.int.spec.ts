import { expect } from 'vitest'

import { test } from './vitest.js'

test.suite('integration config fixture', { config: './configImport.config.ts' }, () => {
  test.beforeAll(() => {
    expect(process.env.PAYLOAD_TEST_CONFIG_IMPORTED).toBe('true')
  })

  test.afterAll(() => {
    delete process.env.PAYLOAD_TEST_CONFIG_IMPORTED
  })

  test('keeps the automatically imported config available to tests', () => {
    expect(process.env.PAYLOAD_TEST_CONFIG_IMPORTED).toBe('true')
  })
})
