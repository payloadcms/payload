import { expect, test } from 'vitest'

import { rewriteBranchIDs, rewriteBranchVersionParents } from './branchIDs.js'

test.each([true, false])(
  'should AND identity with sibling OR regardless of key order (%s)',
  (isIdentityFirst) => {
    const or = [{ title: { equals: 'Allowed' } }]
    const where = isIdentityFirst
      ? { id: { equals: 'canonical' }, or }
      : { or, id: { equals: 'canonical' } }

    expect(rewriteBranchIDs(where)).toMatchObject({
      and: [{ or }, { or: [{ _branchDocID: { equals: 'canonical' } }, {}] }],
    })
  },
)

test('should retain version parent identity alongside sibling OR', () => {
  const or = [{ 'version.title': { equals: 'Allowed' } }]

  expect(rewriteBranchVersionParents({ parent: { equals: 'canonical' }, or })).toMatchObject({
    and: [{ or }, { or: [{ _branchParent: { equals: 'canonical' } }, {}] }],
  })
})

test.each(['not_equals', 'not_in'])(
  'should require canonical identity presence for %s constraints',
  (operator) => {
    const constraint = { [operator]: operator === 'not_in' ? ['hidden'] : 'hidden' }

    expect(rewriteBranchIDs({ id: constraint })).toEqual({
      and: [
        {
          or: [
            { and: [{ _branchDocID: { exists: true } }, { _branchDocID: constraint }] },
            { and: [{ _branchDocID: { exists: false } }, { id: constraint }] },
          ],
        },
      ],
    })
    expect(rewriteBranchVersionParents({ parent: constraint })).toEqual({
      and: [
        {
          or: [
            { and: [{ _branchParent: { exists: true } }, { _branchParent: constraint }] },
            { and: [{ _branchParent: { exists: false } }, { parent: constraint }] },
          ],
        },
      ],
    })
  },
)
