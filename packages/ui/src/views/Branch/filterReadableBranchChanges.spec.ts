import { expect, test, vi } from 'vitest'

import { filterReadableBranchChanges } from './filterReadableBranchChanges.js'

vi.mock('payload', () => ({
  Forbidden: class Forbidden extends Error {},
  NotFound: class NotFound extends Error {},
  isolateBranchState: (req: object) => ({ ...req, context: {} }),
}))

test('should omit unreadable documents and globals while retaining readable branch changes', async () => {
  const findByID = vi.fn(async ({ id }: { id: string }) => (id === 'hidden' ? null : { id }))
  const findGlobal = vi.fn(async () => null)
  const user = { id: 'reader' }
  const changes = [
    {
      id: 'readable-create',
      collectionSlug: 'posts',
      docID: 'created',
      operation: 'create' as const,
    },
    { id: 'hidden-update', collectionSlug: 'posts', docID: 'hidden', operation: 'update' as const },
    {
      id: 'readable-delete',
      collectionSlug: 'posts',
      docID: 'deleted',
      operation: 'delete' as const,
    },
    { id: 'hidden-global', globalSlug: 'settings', operation: 'update' as const },
  ]
  const req = {
    user,
    payload: {
      findByID,
      findGlobal,
      collections: { posts: { config: { versions: { drafts: true } } } },
      globals: { config: [{ slug: 'settings', versions: false }] },
    },
  }

  const result = await filterReadableBranchChanges({
    branch: 'campaign',
    changes,
    req: req as never,
  })

  expect(result.map(({ id }) => id)).toEqual(['readable-create', 'readable-delete'])
  expect(findByID).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'created',
      branch: 'campaign',
      draft: true,
      overrideAccess: false,
      user,
    }),
  )
  expect(findByID).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'deleted', branch: 'main', overrideAccess: false, user }),
  )
  expect(findGlobal).toHaveBeenCalledWith(
    expect.objectContaining({ slug: 'settings', branch: 'campaign', overrideAccess: false, user }),
  )
  expect(findByID.mock.calls[0]![0]).not.toHaveProperty('req', req)
})
