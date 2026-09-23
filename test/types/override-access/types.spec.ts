import type { OverrideAccessOption } from 'payload'

import { expect, test } from 'tstyche'

test('should expose the shared override access option', () => {
  expect<OverrideAccessOption>().type.toBe<{
    overrideAccess?: boolean
  }>()
})
