import { describe, expect, it, test } from 'vitest'

import { projectBranchIDs, rewriteBranchIDs, rewriteBranchVersionParents } from './branchIDs.js'

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

describe('projectBranchIDs', () => {
  it('should replace a shadow row id with its canonical id', () => {
    const docs = [{ _branchDocID: 7, id: 456, title: 'shadow' }]

    expect(projectBranchIDs(docs)[0]!.id).toBe(7)
  })

  it('should unwrap a relationship-shaped canonical id', () => {
    const docs = [{ _branchDocID: { relationTo: 'posts', value: 7 }, id: 456 }]

    expect(projectBranchIDs(docs)[0]!.id).toBe(7)
  })

  it('should leave main rows and branch-created rows alone', () => {
    const docs = [{ _branchDocID: null, id: 1 }, { id: 2 }]

    expect(projectBranchIDs(docs).map((doc) => doc.id)).toEqual([1, 2])
  })
})

test('should preserve non-identity filters and undefined input', () => {
  expect(rewriteBranchIDs(undefined)).toBeUndefined()
  expect(rewriteBranchIDs({ title: { equals: 'hi' } })).toEqual({ title: { equals: 'hi' } })
})

test('should retain nested AND and OR filters while rewriting identity', () => {
  expect(
    rewriteBranchIDs({ and: [{ title: { equals: 'x' } }, { or: [{ id: { in: [1, 2] } }] }] }),
  ).toMatchObject({
    and: [
      { title: { equals: 'x' } },
      { or: [{ and: [{ or: [{ _branchDocID: { in: [1, 2] } }, {}] }] }] },
    ],
  })
})
