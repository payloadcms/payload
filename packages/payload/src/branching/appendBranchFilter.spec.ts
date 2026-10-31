import { describe, expect, it } from 'vitest'

import { appendBranchFilter } from './appendBranchFilter.js'

const userWhere = { title: { equals: 'Halloween Sale' } }

describe('appendBranchFilter', () => {
  it('should return the query untouched when branching is disabled', () => {
    const result = appendBranchFilter({
      branch: 'main',
      deletedIDs: [],
      enabled: false,
      shadowedIDs: [],
      where: userWhere,
    })

    // Identity, not just equality: a branching-disabled config must take the
    // same code path it does today, with no extra allocation.
    expect(result).toBe(userWhere)
  })

  it('should add a single indexed equality on main', () => {
    const result = appendBranchFilter({
      branch: 'main',
      deletedIDs: [],
      enabled: true,
      shadowedIDs: [1, 2, 3],
      where: userWhere,
    })

    expect(result).toEqual({
      and: [userWhere, { _branch: { equals: 'main' } }],
    })
  })

  it('should select branch rows plus unshadowed main rows on a branch', () => {
    const result = appendBranchFilter({
      branch: 'halloween',
      deletedIDs: [9],
      enabled: true,
      shadowedIDs: [7, 9],
      where: userWhere,
    })

    expect(result).toEqual({
      and: [
        userWhere,
        {
          or: [
            {
              and: [
                { _branch: { equals: 'halloween' } },
                {
                  or: [{ _branchDocID: { not_in: [9] } }, { _branchDocID: { equals: null } }],
                },
              ],
            },
            {
              and: [{ _branch: { equals: 'main' } }, { id: { not_in: [7, 9] } }],
            },
          ],
        },
      ],
    })
  })

  it('should omit the not_in clause when the branch has shadowed nothing', () => {
    const result = appendBranchFilter({
      branch: 'halloween',
      deletedIDs: [],
      enabled: true,
      shadowedIDs: [],
      where: {},
    })

    expect(result).toEqual({
      and: [{ or: [{ _branch: { equals: 'halloween' } }, { _branch: { equals: 'main' } }] }],
    })
  })

  it('should merge into an existing and-clause rather than nesting it', () => {
    const result = appendBranchFilter({
      branch: 'main',
      deletedIDs: [],
      enabled: true,
      shadowedIDs: [],
      where: { and: [userWhere] },
    })

    expect(result).toEqual({
      and: [userWhere, { _branch: { equals: 'main' } }],
    })
  })

  it('should hide change-record tombstones on a branch', () => {
    const result = appendBranchFilter({
      branch: 'halloween',
      deletedIDs: [7],
      enabled: true,
      shadowedIDs: [7],
      where: {},
    })

    expect(JSON.stringify(result)).toContain('"_branchDocID":{"not_in":[7]}')
    expect(JSON.stringify(result)).not.toContain('_branchOp')
  })

  it('should not add deletion filtering on main, where tombstones cannot exist', () => {
    const result = appendBranchFilter({
      branch: 'main',
      deletedIDs: [7],
      enabled: true,
      shadowedIDs: [],
      where: {},
    })

    expect(JSON.stringify(result)).not.toContain('_branchOp')
    expect(JSON.stringify(result)).not.toContain('_branchDocID')
  })
})
