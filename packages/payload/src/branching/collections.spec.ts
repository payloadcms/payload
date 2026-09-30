import { expect, test } from 'vitest'

import { combineBranchAccess } from './combineBranchAccess.js'

test('should require read access as well as delete access when deleting a branch', async () => {
  const access = combineBranchAccess({ readAccess: () => false, writeAccess: () => true })

  await expect(access({} as never)).resolves.toBe(false)
})

test('should combine branch read and delete access constraints', async () => {
  const access = combineBranchAccess({
    readAccess: () => ({ slug: { not_equals: 'private' } }),
    writeAccess: () => ({ status: { equals: 'open' } }),
  })

  await expect(access({} as never)).resolves.toEqual({
    and: [{ slug: { not_equals: 'private' } }, { status: { equals: 'open' } }],
  })
})
