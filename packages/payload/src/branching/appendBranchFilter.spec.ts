import { describe, expect, it } from 'vitest'

import { appendBranchFilter } from './appendBranchFilter.js'

const userWhere = { title: { equals: 'Halloween Sale' } }

describe('appendBranchFilter', () => {
  it('should return the query untouched when branching is disabled', () => {
    const result = appendBranchFilter({
      branch: 'main',
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
      enabled: true,
      shadowedIDs: [7, 9],
      where: userWhere,
    })

    expect(result).toEqual({
      and: [
        userWhere,
        {
          or: [
            { _branch: { equals: 'halloween' } },
            {
              and: [{ _branch: { equals: 'main' } }, { id: { not_in: [7, 9] } }],
            },
          ],
        },
        { _branchOp: { not_equals: 'delete' } },
      ],
    })
  })

  it('should omit the not_in clause when the branch has shadowed nothing', () => {
    const result = appendBranchFilter({
      branch: 'halloween',
      enabled: true,
      shadowedIDs: [],
      where: {},
    })

    expect(result).toEqual({
      and: [
        { or: [{ _branch: { equals: 'halloween' } }, { _branch: { equals: 'main' } }] },
        { _branchOp: { not_equals: 'delete' } },
      ],
    })
  })

  it('should merge into an existing and-clause rather than nesting it', () => {
    const result = appendBranchFilter({
      branch: 'main',
      enabled: true,
      shadowedIDs: [],
      where: { and: [userWhere] },
    })

    expect(result).toEqual({
      and: [userWhere, { _branch: { equals: 'main' } }],
    })
  })

  it('should hide tombstones on a branch', () => {
    const result = appendBranchFilter({
      branch: 'halloween',
      enabled: true,
      shadowedIDs: [],
      where: {},
    })

    expect(result.and).toContainEqual({ _branchOp: { not_equals: 'delete' } })
  })

  it('should not filter tombstones on main, where they cannot exist', () => {
    const result = appendBranchFilter({
      branch: 'main',
      enabled: true,
      shadowedIDs: [],
      where: {},
    })

    expect(JSON.stringify(result)).not.toContain('_branchOp')
  })
})
