import { describe, expect, it } from 'vitest'

import { projectBranchIDs, rewriteBranchIDs } from './branchIDs.js'

describe('rewriteBranchIDs', () => {
  it('should leave a query with no id constraint untouched', () => {
    expect(rewriteBranchIDs({ title: { equals: 'hi' } })).toEqual({ title: { equals: 'hi' } })
  })

  it('should match either a shadow row canonical id or a main row own id', () => {
    expect(rewriteBranchIDs({ id: { equals: 7 } })).toEqual({
      or: [
        { _branchDocID: { equals: 7 } },
        { and: [{ _branchDocID: { exists: false } }, { id: { equals: 7 } }] },
      ],
    })
  })

  it('should rewrite id constraints nested inside and/or', () => {
    const result = rewriteBranchIDs({
      and: [{ title: { equals: 'x' } }, { or: [{ id: { in: [1, 2] } }] }],
    })

    expect(result).toEqual({
      and: [
        { title: { equals: 'x' } },
        {
          or: [
            {
              or: [
                { _branchDocID: { in: [1, 2] } },
                { and: [{ _branchDocID: { exists: false } }, { id: { in: [1, 2] } }] },
              ],
            },
          ],
        },
      ],
    })
  })

  it('should preserve sibling constraints alongside a rewritten id', () => {
    const result = rewriteBranchIDs({ id: { equals: 3 }, title: { equals: 'x' } })

    expect(result.title).toEqual({ equals: 'x' })
    expect(result.or).toHaveLength(2)
  })

  it('should pass through undefined', () => {
    expect(rewriteBranchIDs(undefined)).toBeUndefined()
  })
})

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
