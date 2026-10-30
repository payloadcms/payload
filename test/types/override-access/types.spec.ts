import type { SharedLocalAPIOptions } from 'payload'

import { expect, test } from 'tstyche'

test('should expose shared Local API options that operations can pick from', () => {
  expect<Pick<SharedLocalAPIOptions, 'overrideAccess'>>().type.toBe<{
    overrideAccess?: boolean
  }>()
})
