import { describe, expect, it } from 'vitest'

import { guardLegacyVersionUpdate } from './guardLegacyVersionUpdate.js'

describe('legacy version mutation protection', () => {
  it('should prevent nested-only updates from skipping the managed generation guard', () => {
    const result = guardLegacyVersionUpdate({
      isBranchStorage: true,
      versionData: { version: { title: { en: 'replacement' } } },
      where: { id: { equals: 12 } },
    })

    expect(result.versionData).toHaveProperty('branchGeneration', null)
    expect(result.where).toEqual({
      and: [{ id: { equals: 12 } }, { branchGeneration: { exists: false } }],
    })
  })

  it.each(['branchGeneration', 'branchFrozen', 'branchOwnerKey'])(
    'should reject mutation of %s outside the native boundary',
    (key) => {
      expect(() =>
        guardLegacyVersionUpdate({
          isBranchStorage: true,
          versionData: { [key]: 1 },
          where: {},
        }),
      ).toThrow('metadata')
    },
  )

  it('should retain latest-only metadata updates on managed versions', () => {
    expect(
      guardLegacyVersionUpdate({
        isBranchStorage: true,
        versionData: { latest: false },
        where: {},
      }),
    ).toEqual({ versionData: { latest: false }, where: {} })
  })

  it('should leave legacy collections unchanged', () => {
    expect(
      guardLegacyVersionUpdate({
        isBranchStorage: false,
        versionData: { version: { title: 'old' } },
        where: {},
      }),
    ).toEqual({ versionData: { version: { title: 'old' } }, where: {} })
  })
})
