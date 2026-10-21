import { describe, expect, it } from 'vitest'

import type { BranchHeadToken } from './types.js'

import {
  areBranchHeadStatesEqual,
  areBranchHeadTokensEqual,
  areBranchScopesEqual,
  areBranchVersionsEqual,
  isBranchHeadReadSetCurrent,
} from './compareBranchHeads.js'

describe('branch head comparisons', () => {
  it('should distinguish shared content from every locale', () => {
    expect(
      areBranchScopesEqual({ left: { type: 'shared' }, right: { locale: 'en', type: 'locale' } }),
    ).toBe(false)
    expect(
      areBranchScopesEqual({
        left: { locale: 'en', type: 'locale' },
        right: { locale: 'fr', type: 'locale' },
      }),
    ).toBe(false)
    expect(areBranchScopesEqual({ left: { type: 'shared' }, right: { type: 'shared' } })).toBe(true)
  })

  it('should compare locale values rather than scope object identity', () => {
    expect(
      areBranchScopesEqual({
        left: { locale: 'en', type: 'locale' },
        right: { locale: 'en', type: 'locale' },
      }),
    ).toBe(true)
  })

  it('should distinguish numeric and string version IDs', () => {
    expect(
      areBranchVersionsEqual({
        left: { generation: 1, id: 7 },
        right: { generation: 1, id: '7' },
      }),
    ).toBe(false)
  })

  it('should detect an autosave change that retains the version ID', () => {
    expect(
      areBranchVersionsEqual({
        left: { generation: 1, id: 'autosave' },
        right: { generation: 2, id: 'autosave' },
      }),
    ).toBe(false)
  })

  it('should distinguish absent content from an explicit withdrawal', () => {
    expect(areBranchHeadStatesEqual({ left: null, right: { type: 'withdrawn' } })).toBe(false)
    expect(
      areBranchHeadStatesEqual({ left: { type: 'withdrawn' }, right: { type: 'withdrawn' } }),
    ).toBe(true)
    expect(areBranchHeadStatesEqual({ left: null, right: null })).toBe(true)
  })

  it('should detect a changed shared structure even when locale content is unchanged', () => {
    const state = {
      structure: { generation: 1, id: 'structure' },
      type: 'version' as const,
      version: { generation: 1, id: 'translation' },
    }

    expect(
      areBranchHeadStatesEqual({
        left: state,
        right: { ...state, structure: { generation: 2, id: 'structure' } },
      }),
    ).toBe(false)
    expect(areBranchHeadStatesEqual({ left: state, right: { ...state, structure: null } })).toBe(
      false,
    )
  })

  it('should detect a head that changed away from a version and then back again', () => {
    const before = getToken({ generation: 1 })
    const after = getToken({ generation: 3 })

    expect(areBranchHeadTokensEqual({ left: before, right: after })).toBe(false)
  })

  it('should reject a token from a different branch or locale', () => {
    const token = getToken({})

    expect(
      areBranchHeadTokensEqual({ left: token, right: { ...token, branchID: 'staging' } }),
    ).toBe(false)
    expect(
      areBranchHeadTokensEqual({
        left: token,
        right: { ...token, scope: { locale: 'fr', type: 'locale' } },
      }),
    ).toBe(false)
  })

  it('should compare inherited read sets without relying on their order', () => {
    const own: BranchHeadToken = {
      branchID: 'drafts',
      generation: null,
      scope: { locale: 'en', type: 'locale' },
      state: null,
    }
    const published = getToken({ branchID: 'main' })

    expect(
      isBranchHeadReadSetCurrent({ actual: [published, own], expected: [own, published] }),
    ).toBe(true)
  })

  it('should detect a newly owned head while resolving inherited content', () => {
    const absent: BranchHeadToken = {
      branchID: 'drafts',
      generation: null,
      scope: { locale: 'en', type: 'locale' },
      state: null,
    }
    const published = getToken({ branchID: 'main' })

    expect(
      isBranchHeadReadSetCurrent({
        actual: [getToken({}), published],
        expected: [absent, published],
      }),
    ).toBe(false)
  })

  it('should require every inherited dependency to remain present', () => {
    const owned = getToken({})
    const published = getToken({ branchID: 'main' })

    expect(isBranchHeadReadSetCurrent({ actual: [owned], expected: [owned, published] })).toBe(
      false,
    )
    expect(isBranchHeadReadSetCurrent({ actual: [owned, published], expected: [owned] })).toBe(
      false,
    )
  })

  it('should reject duplicate scope tokens on either side of a read set', () => {
    const owned = getToken({})
    const published = getToken({ branchID: 'main' })

    expect(
      isBranchHeadReadSetCurrent({ actual: [owned, owned], expected: [owned, published] }),
    ).toBe(false)
    expect(
      isBranchHeadReadSetCurrent({ actual: [owned, published], expected: [owned, owned] }),
    ).toBe(false)
    expect(isBranchHeadReadSetCurrent({ actual: [owned, owned], expected: [owned, owned] })).toBe(
      false,
    )
  })

  it('should compare complete state instead of trusting a matching head generation alone', () => {
    const before = getToken({})
    const after = getToken({ versionID: 'other-version' })

    expect(areBranchHeadTokensEqual({ left: before, right: after })).toBe(false)
  })
})

const getToken = ({
  branchID = 'drafts',
  generation = 1,
  versionID = 'version',
}: {
  branchID?: string
  generation?: number
  versionID?: string
}): BranchHeadToken => ({
  branchID,
  generation,
  scope: { locale: 'en', type: 'locale' },
  state: { structure: null, type: 'version', version: { generation: 1, id: versionID } },
})
