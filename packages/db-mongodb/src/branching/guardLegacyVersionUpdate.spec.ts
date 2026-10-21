import { describe, expect, it } from 'vitest'

import { guardLegacyVersionUpdate } from './guardLegacyVersionUpdate.js'

describe('guardLegacyVersionUpdate', () => {
  it('should preserve the full legacy predicate while excluding managed versions', () => {
    const query = { $or: [{ _id: 'version' }, { parent: 'document' }] }

    expect(guardLegacyVersionUpdate({ data: { version: { title: 'edit' } }, query })).toEqual({
      $and: [query, { branchGeneration: { $exists: false } }],
    })
  })

  it.each(['branchGeneration', 'branchFrozen', 'branchOwnerKey', 'branchFrozen.extra', '$set'])(
    'should reject metadata or operator injection through %s',
    (key) => {
      expect(() => guardLegacyVersionUpdate({ data: { [key]: true }, query: {} })).toThrow(
        'Branch version metadata cannot be written through legacy version updates.',
      )
    },
  )

  it('should permit user content with branch-like field names inside the version', () => {
    expect(() =>
      guardLegacyVersionUpdate({ data: { version: { branchFrozen: 'user content' } }, query: {} }),
    ).not.toThrow()
  })

  it('should permit latest-only bookkeeping without permitting a simultaneous content write', () => {
    const query = { _id: 'version' }

    expect(guardLegacyVersionUpdate({ data: { latest: false }, query })).toBe(query)
    expect(
      guardLegacyVersionUpdate({ data: { latest: false, version: { title: 'edit' } }, query }),
    ).toEqual({ $and: [query, { branchGeneration: { $exists: false } }] })
  })
})
