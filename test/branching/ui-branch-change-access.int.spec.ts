/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the admin access boundary against the real Payload fixture. */
import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { filterReadableBranchChanges } from '../../packages/ui/src/views/Branch/filterReadableBranchChanges.js'
import { test } from '../__helpers/int/vitest.js'
import { hookSpy } from './hookSpy.js'
import { headerGlobalSlug, postsSlug } from './shared.js'

const branch = 'halloween-updates'

test.suite('Branching: changed-document read access', { config: './config.ts' }, () => {
  test.afterEach(() => {
    delete hookSpy.restrictLedgerSnapshotEntityRead
    delete hookSpy.restrictLedgerSnapshotGlobalRead
  })

  test('should exclude unreadable documents while keeping branch creates and deletions', async ({
    payload,
  }) => {
    const created = await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      branch,
      data: { title: 'Created', order: 1 },
    })
    const hidden = await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      branch,
      data: { title: 'Hidden', order: 2 },
    })
    const deleted = await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { title: 'Deleted', order: 1 },
    })

    await payload.delete({ overrideAccess: true, collection: postsSlug, branch, id: deleted.id })
    const req = await getReaderRequest({ payload })

    hookSpy.restrictLedgerSnapshotEntityRead = true
    const changes = [
      { id: 'create', collectionSlug: postsSlug, docID: created.id, operation: 'create' as const },
      { id: 'hidden', collectionSlug: postsSlug, docID: hidden.id, operation: 'create' as const },
      { id: 'delete', collectionSlug: postsSlug, docID: deleted.id, operation: 'delete' as const },
    ]
    const result = await filterReadableBranchChanges({ branch, changes, req })

    expect(result.map(({ id }) => id)).toEqual(['create', 'delete'])
  })

  test('should exclude a global whose data fails read access', async ({ payload }) => {
    await payload.updateGlobal({
      overrideAccess: true,
      slug: headerGlobalSlug,
      data: { navLabel: 'Private main label' },
    })
    await payload.updateGlobal({
      overrideAccess: true,
      slug: headerGlobalSlug,
      branch,
      data: { navLabel: 'Private branch label' },
    })
    const req = await getReaderRequest({ payload })

    hookSpy.restrictLedgerSnapshotGlobalRead = true
    const changes = [{ id: 'global', globalSlug: headerGlobalSlug, operation: 'update' as const }]
    const result = await filterReadableBranchChanges({ branch, changes, req })

    expect(result).toEqual([])
  })
})

async function getReaderRequest({ payload }: { payload: Payload }) {
  const user = await payload.create({
    overrideAccess: true,
    collection: 'users',
    data: { email: 'ledger-reader@example.com', password: 'test' },
  })

  return createPayloadRequest({ branch, payload, user: { ...user, collection: 'users' } })
}
