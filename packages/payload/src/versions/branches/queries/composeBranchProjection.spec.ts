import { describe, expect, it } from 'vitest'

import type { BranchHeadState } from '../types.js'

import { compileBranchScopeFields } from '../compileBranchScopeFields.js'
import { composeBranchProjection } from './composeBranchProjection.js'

const fields = compileBranchScopeFields({
  fields: [
    { name: 'category', type: 'text' },
    { name: 'title', type: 'text', localized: true },
    { name: 'rows', type: 'array', fields: [{ name: 'label', type: 'text', localized: true }] },
  ],
})
const state = ({ id }: { id: number }): BranchHeadState => ({
  type: 'version',
  version: { id, generation: 1 },
  structure: null,
})
const live = {
  category: 'Live',
  title: { en: 'English', fr: 'French' },
  rows: [{ id: 'a', label: { en: 'A', fr: 'Un' } }],
}

describe('Effective branch query composition', () => {
  it('should project live selection status rather than the snapshot historical draft status', () => {
    const result = composeBranchProjection({
      fields,
      isStatusLocalized: true,
      logicalID: 1,
      scopes: [
        { scope: { type: 'shared' }, selected: state({ id: 1 }), main: state({ id: 1 }) },
        {
          scope: { type: 'locale', locale: 'en' },
          selected: state({ id: 1 }),
          main: state({ id: 1 }),
        },
        {
          scope: { type: 'locale', locale: 'fr' },
          selected: state({ id: 2 }),
          main: state({ id: 1 }),
        },
      ],
      versions: [
        {
          reference: { id: 1, generation: 1 },
          data: { ...live, _status: { en: 'draft', fr: 'draft' } },
        },
        {
          reference: { id: 2, generation: 1 },
          data: { ...live, title: { fr: 'Working' }, _status: { fr: 'published' } },
        },
      ],
    })

    expect(result).toMatchObject({
      data: {
        id: 1,
        title: { en: 'English', fr: 'Working' },
        _status: { en: 'published', fr: 'draft' },
      },
      conflictedLocales: [],
    })
  })

  it('should keep absent locales neutral for scalar status while retaining localized draft status', () => {
    const args = {
      fields,
      logicalID: 1,
      scopes: [
        { scope: { type: 'shared' as const }, selected: state({ id: 1 }), main: state({ id: 1 }) },
        {
          scope: { type: 'locale' as const, locale: 'en' },
          selected: state({ id: 1 }),
          main: state({ id: 1 }),
        },
        { scope: { type: 'locale' as const, locale: 'fr' }, selected: null, main: null },
      ],
      versions: [
        {
          reference: { id: 1, generation: 1 },
          data: { category: 'Shared', title: { en: 'English' } },
        },
      ],
    }
    expect(composeBranchProjection(args).data._status).toBe('published')
    expect(composeBranchProjection({ ...args, isStatusLocalized: true }).data._status).toEqual({
      en: 'published',
      fr: 'draft',
    })
    const unpublished = args.scopes.map((scope) =>
      scope.scope.type === 'locale' ? { ...scope, selected: null, main: null } : scope,
    )
    expect(composeBranchProjection({ ...args, scopes: unpublished }).data._status).toBe('draft')
    const differing = args.scopes.map((scope) =>
      scope.scope.type === 'locale' && scope.scope.locale === 'fr'
        ? { ...scope, selected: state({ id: 1 }) }
        : scope,
    )
    expect(composeBranchProjection({ ...args, scopes: differing }).data._status).toBe('draft')
    const withdrawn = args.scopes.map((scope) =>
      scope.scope.type === 'locale' && scope.scope.locale === 'en'
        ? { ...scope, selected: { type: 'withdrawn' as const } }
        : scope,
    )
    expect(composeBranchProjection({ ...args, scopes: withdrawn }).data._status).toBe('draft')
  })

  it('should determine publication from heads rather than translated field completeness', () => {
    const reference = { id: 1, generation: 1 }
    const scopes = [
      { scope: { type: 'shared' as const }, selected: state({ id: 1 }), main: state({ id: 1 }) },
      {
        scope: { type: 'locale' as const, locale: 'en' },
        selected: state({ id: 1 }),
        main: state({ id: 1 }),
      },
    ]
    expect(
      composeBranchProjection({
        fields,
        logicalID: 1,
        scopes,
        versions: [{ reference, data: { category: 'Shared' } }],
      }).data._status,
    ).toBe('published')
    const sharedFields = compileBranchScopeFields({ fields: [{ name: 'category', type: 'text' }] })
    expect(
      composeBranchProjection({
        fields: sharedFields,
        logicalID: 1,
        scopes: scopes.slice(0, 1),
        versions: [{ reference, data: { category: 'Shared' } }],
      }).data._status,
    ).toBe('published')
  })

  it('should require the current live shared selection before reporting a locale as published', () => {
    const result = composeBranchProjection({
      fields,
      logicalID: 1,
      isStatusLocalized: true,
      scopes: [
        { scope: { type: 'shared' }, selected: state({ id: 2 }), main: state({ id: 1 }) },
        {
          scope: { type: 'locale', locale: 'en' },
          selected: state({ id: 1 }),
          main: state({ id: 1 }),
        },
      ],
      versions: [
        { reference: { id: 1, generation: 1 }, data: live },
        { reference: { id: 2, generation: 1 }, data: { ...live, category: 'Working' } },
      ],
    })

    expect(result.data).toMatchObject({ category: 'Working', _status: { en: 'draft' } })
  })

  it('should isolate a structural conflict without serving the earlier translation rows', () => {
    const changed = {
      category: 'New main',
      title: { en: 'New English', fr: 'New French' },
      rows: [{ id: 'b', label: { en: 'B', fr: 'Deux' } }],
    }
    const result = composeBranchProjection({
      fields,
      logicalID: 1,
      isStatusLocalized: true,
      scopes: [
        { scope: { type: 'shared' }, selected: state({ id: 2 }), main: state({ id: 2 }) },
        {
          scope: { type: 'locale', locale: 'en' },
          selected: state({ id: 2 }),
          main: state({ id: 2 }),
        },
        {
          scope: { type: 'locale', locale: 'fr' },
          selected: state({ id: 1 }),
          main: state({ id: 2 }),
        },
      ],
      versions: [
        { reference: { id: 1, generation: 1 }, data: live },
        { reference: { id: 2, generation: 1 }, data: changed },
      ],
    })

    expect(result.conflictedLocales).toEqual(['fr'])
    expect(result.data).toMatchObject({
      category: 'New main',
      title: { en: 'New English' },
      rows: [{ id: 'b', label: { en: 'B' } }],
      _status: { en: 'published', fr: 'draft' },
    })
    expect(result.data.title).not.toHaveProperty('fr')
  })

  it('should preserve shared row order while matching locale rows by typed identity', () => {
    const shared = { ...live, rows: [{ id: 'b' }, { id: 'a' }] }
    const translated = {
      ...live,
      rows: [
        { id: 'a', label: { fr: 'Un' } },
        { id: 'b', label: { fr: 'Deux' } },
      ],
    }
    const result = composeBranchProjection({
      fields,
      logicalID: '1',
      scopes: [
        { scope: { type: 'shared' }, selected: state({ id: 1 }), main: state({ id: 1 }) },
        {
          scope: { type: 'locale', locale: 'fr' },
          selected: state({ id: 2 }),
          main: state({ id: 1 }),
        },
      ],
      versions: [
        { reference: { id: 1, generation: 1 }, data: shared },
        { reference: { id: 2, generation: 1 }, data: translated },
      ],
    })

    expect(result.conflictedLocales).toEqual([])
    expect(result.data).toMatchObject({
      id: '1',
      rows: [
        { id: 'b', label: { fr: 'Deux' } },
        { id: 'a', label: { fr: 'Un' } },
      ],
      _status: 'draft',
    })
  })

  it('should validate the selected structure dependency even when translated values omit its rows', () => {
    const shared = { ...live, rows: [{ id: 'b' }] }
    const locale = { title: { fr: 'Standalone' } }
    const selection: BranchHeadState = {
      type: 'version',
      version: { id: 3, generation: 1 },
      structure: { id: 1, generation: 1 },
    }
    const args = {
      fields,
      logicalID: 1,
      scopes: [
        { scope: { type: 'shared' as const }, selected: state({ id: 2 }), main: state({ id: 2 }) },
        {
          scope: { type: 'locale' as const, locale: 'fr' },
          selected: selection,
          main: state({ id: 2 }),
        },
      ],
      versions: [
        { reference: { id: 1, generation: 1 }, data: live },
        { reference: { id: 2, generation: 1 }, data: shared },
        { reference: { id: 3, generation: 1 }, data: locale },
      ],
    }

    expect(composeBranchProjection(args).conflictedLocales).toEqual(['fr'])
    expect(() => composeBranchProjection({ ...args, versions: args.versions.slice(1) })).toThrow(
      'missing structure revision',
    )
  })

  it('should suppress a withdrawn locale instead of inheriting its main content', () => {
    const result = composeBranchProjection({
      fields,
      logicalID: 1,
      isStatusLocalized: true,
      scopes: [
        { scope: { type: 'shared' }, selected: state({ id: 1 }), main: state({ id: 1 }) },
        {
          scope: { type: 'locale', locale: 'en' },
          selected: { type: 'withdrawn' },
          main: state({ id: 1 }),
        },
      ],
      versions: [{ reference: { id: 1, generation: 1 }, data: live }],
    })

    expect(result.data).toMatchObject({ category: 'Live', _status: { en: 'draft' } })
    expect(result.data).not.toHaveProperty('title')
  })
})
