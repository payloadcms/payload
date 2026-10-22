import { describe, expect, it } from 'vitest'

import {
  areBranchAutosaveScopesEqual,
  planBranchAutosaveOwnership,
} from './prepareBranchAutosave.js'

// Native JSON object storage omits undefined keys; other values retain their identity.
describe('Autosave canonical scope comparison', () => {
  it('should omit undefined object properties recursively without losing content', () => {
    expect(
      areBranchAutosaveScopesEqual({
        left: {
          audit: undefined,
          group: { a: 1, audit: undefined },
          rows: [{ id: 'a', audit: undefined }],
        },
        right: { group: { a: 1 }, rows: [{ id: 'a' }] },
      }),
    ).toBe(true)
  })
  it('should preserve null, array entries, row order and native typed values', () => {
    for (const [left, right] of [
      [{}, { a: null }],
      [[undefined], [null]],
      [
        [1, 2],
        [2, 1],
      ],
      [[{ id: 'a' }], [{ id: 'b' }]],
      [new Date('2026-01-01'), '2026-01-01T00:00:00.000Z'],
    ]) {
      expect(areBranchAutosaveScopesEqual({ left, right })).toBe(false)
    }
  })
})

describe('Autosave reference closure', () => {
  const reference = { id: 1, generation: 3 }
  const english = {
    branchID: 'drafts',
    generation: 2,
    incarnation: 0,
    scope: { type: 'locale' as const, locale: 'en' },
    state: { type: 'version' as const, version: reference, structure: { id: 2, generation: 1 } },
  }
  const french = { ...english, scope: { type: 'locale' as const, locale: 'fr' } }
  const fields = [{ name: 'title', type: 'value' as const, isLocalized: true }]
  const stored = {
    title: { en: 'old', fr: 'unchanged' },
    _status: { en: 'draft', fr: 'published' },
  }
  const args = {
    branchID: 'drafts',
    data: { ...stored, title: { en: 'new', fr: 'unchanged' } },
    fields,
    hasSharedChange: false,
    observed: [english, french],
    reference,
    references: [english, french],
    selected: [english],
    stored,
  }

  it('should advance an unchanged unselected locale in the complete ownership closure', () => {
    expect(planBranchAutosaveOwnership(args)?.closure).toEqual([english, french])
  })
  it('should reject changing an unselected locale body or localized status', () => {
    expect(
      planBranchAutosaveOwnership({
        ...args,
        data: { ...args.data, title: { en: 'new', fr: 'changed' } },
      }),
    ).toBeNull()
    expect(
      planBranchAutosaveOwnership({
        ...args,
        data: { ...args.data, _status: { en: 'draft', fr: 'draft' } },
      }),
    ).toBeNull()
  })
  it('should reject structural and external branch references', () => {
    expect(
      planBranchAutosaveOwnership({ ...args, references: [{ ...french, branchID: 'staging' }] }),
    ).toBeNull()
    expect(
      planBranchAutosaveOwnership({
        ...args,
        references: [{ ...french, state: { ...french.state, structure: reference } }],
      }),
    ).toBeNull()
  })
  it('should conflict on an unobserved owner head instead of hiding it with copy on write', () => {
    expect(() => planBranchAutosaveOwnership({ ...args, observed: [english] })).toThrow(
      'changed after operation observations',
    )
  })
})
