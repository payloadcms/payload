import { expect } from 'vitest'

import { test } from './vitest.js'

test.suite({ config: './configImport.config.ts' })('integration config fixture', () => {
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
