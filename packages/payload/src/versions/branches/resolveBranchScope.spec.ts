import { describe, expect, it } from 'vitest'

import type { BranchContentScope, BranchHead, BranchHeadState } from './types.js'

import { isBranchHeadReadSetCurrent } from './compareBranchHeads.js'
import { resolveBranchScope } from './resolveBranchScope.js'

const english: BranchContentScope = { locale: 'en', type: 'locale' }
const french: BranchContentScope = { locale: 'fr', type: 'locale' }
const shared: BranchContentScope = { type: 'shared' }

describe('resolveBranchScope', () => {
  it('should inherit published content only when the working scope is absent', () => {
    const publishedHead = getHead({ branchID: 'main' })
    const result = resolveBranchScope({
      branchHead: null,
      branchID: 'drafts',
      publishedBranchID: 'main',
      publishedHead,
      scope: english,
    })

    expect(result.state).toStrictEqual(publishedHead.state)
    expect(result.isInherited).toBe(true)
    expect(result.source.branchID).toBe('main')
    expect(result.readSet).toStrictEqual([
      { branchID: 'drafts', generation: null, scope: english, state: null },
      { branchID: 'main', generation: 1, scope: english, state: publishedHead.state },
    ])
  })

  it('should preserve an explicit withdrawal instead of restoring inherited content', () => {
    const result = resolveBranchScope({
      branchHead: getHead({ state: { type: 'withdrawn' } }),
      branchID: 'drafts',
      publishedBranchID: 'main',
      publishedHead: getHead({ branchID: 'main' }),
      scope: english,
    })

    expect(result.state).toStrictEqual({ type: 'withdrawn' })
    expect(result.isInherited).toBe(false)
    expect(result.readSet).toHaveLength(1)
  })

  it('should keep owned working content when the published content advances', () => {
    const branchHead = getHead({ versionID: 'working' })
    const result = resolveBranchScope({
      branchHead,
      branchID: 'drafts',
      publishedBranchID: 'main',
      publishedHead: getHead({ branchID: 'main', generation: 4, versionID: 'new-publication' }),
      scope: english,
    })

    expect(result.state).toStrictEqual(branchHead.state)
    expect(result.isInherited).toBe(false)
    expect(result.readSet.map((token) => token.branchID)).toStrictEqual(['drafts'])
  })

  it('should preserve absent and withdrawn publication states separately', () => {
    const absent = resolveBranchScope({
      branchHead: null,
      branchID: 'staging',
      publishedBranchID: 'main',
      scope: french,
    })
    const withdrawn = resolveBranchScope({
      branchHead: null,
      branchID: 'staging',
      publishedBranchID: 'main',
      publishedHead: getHead({ branchID: 'main', scope: french, state: { type: 'withdrawn' } }),
      scope: french,
    })

    expect(absent.state).toBeNull()
    expect(withdrawn.state).toStrictEqual({ type: 'withdrawn' })
    expect(absent.readSet).not.toStrictEqual(withdrawn.readSet)
  })

  it('should never inherit content into an absent published scope', () => {
    const result = resolveBranchScope({
      branchHead: null,
      branchID: 'main',
      publishedBranchID: 'main',
      scope: english,
    })

    expect(result.state).toBeNull()
    expect(result.isInherited).toBe(false)
    expect(result.readSet).toStrictEqual([
      { branchID: 'main', generation: null, scope: english, state: null },
    ])
  })

  it('should retain the published withdrawal even when older content remains in history', () => {
    const result = resolveBranchScope({
      branchHead: getHead({ branchID: 'main', state: { type: 'withdrawn' } }),
      branchID: 'main',
      publishedBranchID: 'main',
      scope: english,
    })

    expect(result.state).toStrictEqual({ type: 'withdrawn' })
    expect(result.isInherited).toBe(false)
  })

  it('should resolve shared content independently of a locale', () => {
    const result = resolveBranchScope({
      branchHead: getHead({ scope: shared }),
      branchID: 'drafts',
      publishedBranchID: 'main',
      scope: shared,
    })

    expect(result.scope).toStrictEqual(shared)
    expect(result.state?.type).toBe('version')
  })

  it('should allow French to keep inheriting when English is owned on the same branch', () => {
    const englishResult = resolveBranchScope({
      branchHead: getHead({ versionID: 'english-draft' }),
      branchID: 'drafts',
      publishedBranchID: 'main',
      scope: english,
    })
    const frenchPublication = getHead({ branchID: 'main', scope: french, versionID: 'french-live' })
    const frenchResult = resolveBranchScope({
      branchHead: null,
      branchID: 'drafts',
      publishedBranchID: 'main',
      publishedHead: frenchPublication,
      scope: french,
    })

    expect(englishResult.isInherited).toBe(false)
    expect(frenchResult.isInherited).toBe(true)
    expect(frenchResult.state).toStrictEqual(frenchPublication.state)
  })

  it('should detect a changed main head while a working scope is inherited', () => {
    const before = resolveBranchScope({
      branchHead: null,
      branchID: 'staging',
      publishedBranchID: 'main',
      publishedHead: getHead({ branchID: 'main' }),
      scope: english,
    })
    const after = resolveBranchScope({
      branchHead: null,
      branchID: 'staging',
      publishedBranchID: 'main',
      publishedHead: getHead({ branchID: 'main', generation: 2 }),
      scope: english,
    })

    expect(isBranchHeadReadSetCurrent({ actual: after.readSet, expected: before.readSet })).toBe(
      false,
    )
  })

  it('should reject a head from another branch', () => {
    expect(() =>
      resolveBranchScope({
        branchHead: getHead({ branchID: 'staging' }),
        branchID: 'drafts',
        publishedBranchID: 'main',
        scope: english,
      }),
    ).toThrow('Branch head does not match')
  })

  it('should reject a head from another locale', () => {
    expect(() =>
      resolveBranchScope({
        branchHead: getHead({ scope: french }),
        branchID: 'drafts',
        publishedBranchID: 'main',
        scope: english,
      }),
    ).toThrow('Branch head does not match')
  })

  it('should reject a fallback head from a branch other than the published branch', () => {
    expect(() =>
      resolveBranchScope({
        branchHead: null,
        branchID: 'drafts',
        publishedBranchID: 'main',
        publishedHead: getHead({ branchID: 'staging' }),
        scope: english,
      }),
    ).toThrow('Branch head does not match')
  })

  it('should use stable numeric branch IDs without coercing them to strings', () => {
    const result = resolveBranchScope({
      branchHead: { ...getHead({}), branchID: 2 },
      branchID: 2,
      publishedBranchID: 1,
      scope: english,
    })

    expect(result.source.branchID).toBe(2)
    expect(result.isInherited).toBe(false)
  })

  it('should resolve frozen input without changing the stored head', () => {
    const head = Object.freeze(getHead({ state: Object.freeze({ type: 'withdrawn' }) }))

    expect(() =>
      resolveBranchScope({
        branchHead: head,
        branchID: 'drafts',
        publishedBranchID: 'main',
        scope: english,
      }),
    ).not.toThrow()
    expect(head.generation).toBe(1)
    expect(head.state).toStrictEqual({ type: 'withdrawn' })
  })
})

const getHead = ({
  branchID = 'drafts',
  generation = 1,
  scope = english,
  state,
  versionID = 'version',
}: {
  branchID?: string
  generation?: number
  scope?: BranchContentScope
  state?: BranchHeadState
  versionID?: string
}): BranchHead => ({
  base: null,
  branchID,
  generation,
  scope,
  state: state ?? { structure: null, type: 'version', version: { generation: 1, id: versionID } },
})
