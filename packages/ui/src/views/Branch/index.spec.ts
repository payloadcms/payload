import { expect, test, vi } from 'vitest'

import { BranchChangesView } from './index.js'

vi.mock('../../exports/client/index.js', () => ({ BranchChanges: () => null }))
vi.mock('../Edit/SetDocumentStepNav/index.js', () => ({ SetDocumentStepNav: () => null }))

test('should read internal branch state only after the branch access check', async () => {
  const find = vi.fn(async ({ collection }: { collection: string }) => ({
    docs: [],
    totalPages: collection === 'payload-branch-merges' ? 1 : undefined,
  }))
  const findByID = vi.fn(async () => ({ name: 'Campaign', slug: 'campaign', status: 'open' }))

  await BranchChangesView({
    initPageResult: {
      collectionConfig: {
        admin: {},
        labels: { plural: 'Branches' },
      },
      docID: 1,
      req: {
        i18n: { t: (key: string) => key },
        payload: { find, findByID },
        user: { id: 1 },
      },
    },
    searchParams: {},
  } as never)

  expect(findByID).toHaveBeenCalledWith(
    expect.objectContaining({ collection: 'payload-branches', overrideAccess: false }),
  )
  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({ collection: 'payload-branch-changes', overrideAccess: true }),
  )
  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({ collection: 'payload-jobs', overrideAccess: true }),
  )

  const branchChangeReadIndex = find.mock.calls.findIndex(
    ([args]) => args.collection === 'payload-branch-changes',
  )
  const scheduledJobReadIndex = find.mock.calls.findIndex(
    ([args]) => args.collection === 'payload-jobs',
  )

  expect(findByID.mock.invocationCallOrder[0]).toBeLessThan(
    find.mock.invocationCallOrder[branchChangeReadIndex]!,
  )
  expect(findByID.mock.invocationCallOrder[0]).toBeLessThan(
    find.mock.invocationCallOrder[scheduledJobReadIndex]!,
  )
})
