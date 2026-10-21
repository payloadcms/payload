import { describe, expect, it } from 'vitest'

import { decodeBranchHead } from './decodeBranchHead.js'

const scope = { locale: 'en', type: 'locale' as const }

describe('decodeBranchHead', () => {
  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, '1'])(
    'should reject an invalid stored generation %j',
    (generation) => {
      expect(() =>
        decodeBranchHead({ branchID: 'main', row: { generation, state: 'withdrawn' }, scope }),
      ).toThrow('positive safe integers')
    },
  )

  it('should reject a partial structural version reference', () => {
    expect(() =>
      decodeBranchHead({
        branchID: 'drafts',
        row: {
          generation: 1,
          state: 'version',
          structureVersionID: 'structure',
          versionGeneration: 1,
          versionID: 'version',
        },
        scope,
      }),
    ).toThrow('positive safe integers')
  })

  it('should reject content references on withdrawn heads', () => {
    expect(() =>
      decodeBranchHead({
        branchID: 'main',
        row: { generation: 1, state: 'withdrawn', versionID: 'old' },
        scope,
      }),
    ).toThrow('cannot reference version content')
  })

  it('should decode a captured base without converting its typed identities', () => {
    const base = {
      branchID: 1,
      generation: 2,
      scope,
      state: { structure: null, type: 'version', version: { generation: 3, id: '7' } },
    }

    expect(
      decodeBranchHead({
        branchID: 'drafts',
        row: { base, generation: 1, state: 'withdrawn' },
        scope,
      }).base,
    ).toStrictEqual(base)
  })

  it.each([
    {},
    [],
    { branchID: 'main', generation: null, scope, state: { type: 'withdrawn' } },
    {
      branchID: 'main',
      generation: 1,
      scope: { type: 'locale', locale: '' },
      state: { type: 'withdrawn' },
    },
  ])('should reject malformed base tokens %j', (base) => {
    expect(() =>
      decodeBranchHead({
        branchID: 'drafts',
        row: { base, generation: 1, state: 'withdrawn' },
        scope,
      }),
    ).toThrow(/branch (base|head)/i)
  })
})
