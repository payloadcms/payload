import { describe, expect, it } from 'vitest'

import { compileBranchScopeFields } from '../compileBranchScopeFields.js'
import { planLegacyBranchHeads } from './planLegacyBranchHeads.js'

const fields = compileBranchScopeFields({
  fields: [
    { name: 'shared', type: 'text' },
    { name: 'title', type: 'text', localized: true },
  ],
})
const live = {
  data: {
    _status: { en: 'published', fr: 'published' },
    shared: 'live shared',
    title: { en: 'English live', fr: 'French live' },
  },
  version: { generation: 1, id: 'actual-materialization' },
}

describe('planLegacyBranchHeads', () => {
  it('should seed main from actual materialization and only override the changed working locale', () => {
    const working = {
      data: {
        ...live.data,
        _status: { en: 'draft', fr: 'published' },
        title: { en: 'English working', fr: 'French live' },
      },
      version: { generation: 1, id: 'working' },
    }
    const result = planLegacyBranchHeads({
      fields,
      locales: ['en', 'fr'],
      materialized: live,
      statusMode: 'localized',
      working,
    })

    expect(result.heads.filter(({ branchID }) => branchID === 'main')).toHaveLength(3)
    expect(result.heads.filter(({ branchID }) => branchID === 'drafts')).toStrictEqual([
      {
        base: {
          branchID: 'main',
          generation: 1,
          scope: { locale: 'en', type: 'locale' },
          state: { structure: null, type: 'version', version: live.version },
        },
        branchID: 'drafts',
        generation: 1,
        scope: { locale: 'en', type: 'locale' },
        state: { structure: null, type: 'version', version: working.version },
      },
    ])
    expect(result.legacyWorkingVersion).toStrictEqual(working.version)
  })

  it('should keep unpublished locale content on drafts even when its payload matches the inactive row', () => {
    const materialized = {
      ...live,
      data: { ...live.data, _status: { en: 'published', fr: 'draft' } },
    }
    const result = planLegacyBranchHeads({
      fields,
      locales: ['en', 'fr'],
      materialized,
      statusMode: 'localized',
      working: null,
    })

    expect(
      result.heads.find(
        ({ branchID, scope }) =>
          branchID === 'main' && scope.type === 'locale' && scope.locale === 'fr',
      )?.state,
    ).toStrictEqual({ type: 'withdrawn' })
    expect(
      result.heads.find(
        ({ branchID, scope }) =>
          branchID === 'drafts' && scope.type === 'locale' && scope.locale === 'fr',
      )?.state,
    ).toStrictEqual({ structure: null, type: 'version', version: live.version })
  })

  it('should preserve legacy draft metadata without manufacturing a content change', () => {
    const working = {
      data: { ...live.data, _status: { en: 'draft', fr: 'draft' } },
      version: { generation: 1, id: 'identical-draft' },
    }
    const result = planLegacyBranchHeads({
      fields,
      locales: ['en', 'fr'],
      materialized: live,
      statusMode: 'localized',
      working,
    })

    expect(result.heads.every(({ branchID }) => branchID === 'main')).toBe(true)
    expect(result.legacyWorkingVersion).toStrictEqual(working.version)
  })

  it('should use scalar publication semantics for legacy localized data', () => {
    const materialized = { ...live, data: { ...live.data, _status: 'published' } }
    const result = planLegacyBranchHeads({
      fields,
      locales: ['en', 'fr'],
      materialized,
      statusMode: 'scalar',
      working: null,
    })

    expect(result.heads).toHaveLength(3)
    expect(result.heads.every(({ state }) => state.type === 'version')).toBe(true)
  })

  it('should support an unpublished nonlocalized identity without publishing its anchor', () => {
    const nonlocalized = compileBranchScopeFields({ fields: [{ name: 'title', type: 'text' }] })
    const materialized = {
      data: { _status: 'draft', title: 'incomplete' },
      version: { generation: 1, id: 4 },
    }
    const result = planLegacyBranchHeads({
      fields: nonlocalized,
      locales: [],
      materialized,
      statusMode: 'scalar',
      working: null,
    })

    expect(result.heads.map(({ branchID, state }) => ({ branchID, state }))).toStrictEqual([
      { branchID: 'main', state: { type: 'withdrawn' } },
      {
        branchID: 'drafts',
        state: { structure: null, type: 'version', version: materialized.version },
      },
    ])
  })

  it('should leave a missing global absent', () => {
    expect(
      planLegacyBranchHeads({
        fields,
        locales: ['en', 'fr'],
        materialized: null,
        statusMode: 'localized',
        working: null,
      }),
    ).toStrictEqual({ heads: [], legacyWorkingVersion: null })
  })

  it('should retain working global content when no live materialization exists', () => {
    const result = planLegacyBranchHeads({
      fields,
      locales: ['en', 'fr'],
      materialized: null,
      statusMode: 'localized',
      working: live,
    })

    expect(
      result.heads
        .filter(({ branchID }) => branchID === 'main')
        .every(({ state }) => state.type === 'withdrawn'),
    ).toBe(true)
    expect(result.heads.filter(({ branchID }) => branchID === 'drafts')).toHaveLength(3)
  })

  it('should attach locale heads to the selected shared structure when working arrays changed', () => {
    const arrayFields = compileBranchScopeFields({
      fields: [
        { name: 'rows', type: 'array', fields: [{ name: 'title', type: 'text', localized: true }] },
      ],
    })
    const materialized = {
      data: {
        _status: { en: 'published', fr: 'published' },
        rows: [{ id: 'old', title: { en: 'English', fr: 'French' } }],
      },
      version: live.version,
    }
    const working = {
      data: {
        ...materialized.data,
        rows: [{ id: 'new', title: { en: 'New English', fr: 'New French' } }],
      },
      version: { generation: 1, id: 'new-structure' },
    }
    const result = planLegacyBranchHeads({
      fields: arrayFields,
      locales: ['en', 'fr'],
      materialized,
      statusMode: 'localized',
      working,
    })
    const draftLocales = result.heads.filter(
      ({ branchID, scope }) => branchID === 'drafts' && scope.type === 'locale',
    )

    expect(draftLocales).toHaveLength(2)
    expect(
      draftLocales.every(
        ({ state }) => state.type === 'version' && state.structure?.id === 'new-structure',
      ),
    ).toBe(true)
  })

  it('should reject an aliased version reference instead of replacing live content with its latest draft payload', () => {
    expect(() =>
      planLegacyBranchHeads({
        fields,
        locales: ['en', 'fr'],
        materialized: live,
        statusMode: 'localized',
        working: { ...live, data: { ...live.data, title: { en: 'wrong live baseline' } } },
      }),
    ).toThrow('different source snapshots')
  })

  it('should keep the same structural reference when only shared array labels changed', () => {
    const arrayFields = compileBranchScopeFields({
      fields: [
        {
          name: 'rows',
          type: 'array',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'title', type: 'text', localized: true },
          ],
        },
      ],
    })
    const materialized = {
      data: {
        _status: { en: 'published', fr: 'published' },
        rows: [{ id: 'a', label: 'live label', title: { en: 'English', fr: 'French' } }],
      },
      version: live.version,
    }
    const working = {
      data: {
        ...materialized.data,
        rows: [{ id: 'a', label: 'working label', title: { en: 'English ready', fr: 'French' } }],
      },
      version: { generation: 1, id: 'working-label' },
    }
    const result = planLegacyBranchHeads({
      fields: arrayFields,
      locales: ['en', 'fr'],
      materialized,
      statusMode: 'localized',
      working,
    })
    const frenchOverride = result.heads.find(
      ({ branchID, scope }) =>
        branchID === 'drafts' && scope.type === 'locale' && scope.locale === 'fr',
    )
    const englishOverride = result.heads.find(
      ({ branchID, scope }) =>
        branchID === 'drafts' && scope.type === 'locale' && scope.locale === 'en',
    )

    expect(frenchOverride).toBeUndefined()
    expect(englishOverride?.state).toStrictEqual({
      structure: live.version,
      type: 'version',
      version: working.version,
    })
  })

  const attachmentFields = compileBranchScopeFields({
    fields: [
      {
        name: 'rows',
        type: 'array',
        fields: [
          { name: 'title', type: 'text', localized: true },
          {
            name: 'blocks',
            type: 'blocks',
            blocks: [
              {
                slug: 'section',
                fields: [
                  { name: 'title', type: 'text', localized: true },
                  {
                    name: 'items',
                    type: 'array',
                    fields: [{ name: 'title', type: 'text', localized: true }],
                  },
                ],
              },
            ],
          },
          {
            name: 'localizedItems',
            type: 'array',
            localized: true,
            fields: [{ name: 'title', type: 'text' }],
          },
        ],
      },
    ],
  })
  const attachmentRow = ({ id }: { id: number | string }) => ({
    id,
    blocks: ['a', 'b'].map((blockID) => ({
      id: blockID,
      blockType: 'section',
      items: ['first', 'second'].map((itemID) => ({
        id: itemID,
        title: { en: `${id} ${blockID} ${itemID}`, fr: `French ${id} ${blockID} ${itemID}` },
      })),
      title: { en: `${id} ${blockID}`, fr: `French ${id} ${blockID}` },
    })),
    localizedItems: {
      en: [
        { id: 'a', title: 'First' },
        { id: 'b', title: 'Second' },
      ],
      fr: [
        { id: 'a', title: 'Premier' },
        { id: 'b', title: 'Deuxième' },
      ],
    },
    title: { en: String(id), fr: `French ${id}` },
  })
  const attachmentData = {
    _status: { en: 'published', fr: 'published' },
    rows: [attachmentRow({ id: 1 }), attachmentRow({ id: '1' })],
  }

  it('should inherit locales after shared arrays, blocks, and nested rows reorder', () => {
    const workingData = structuredClone(attachmentData)

    workingData.rows.reverse()

    for (const row of workingData.rows) {
      row.blocks.reverse()

      for (const block of row.blocks) {
        block.items.reverse()
      }
    }

    const result = planLegacyBranchHeads({
      fields: attachmentFields,
      locales: ['en', 'fr'],
      materialized: { data: attachmentData, version: live.version },
      statusMode: 'localized',
      working: { data: workingData, version: { generation: 1, id: 'reordered' } },
    })

    expect(
      result.heads.filter(({ branchID }) => branchID === 'drafts').map(({ scope }) => scope),
    ).toStrictEqual([{ type: 'shared' }])
    expect(workingData.rows[0]!.id).toBe('1')
    expect(attachmentData.rows[0]!.id).toBe(1)
  })

  it('should retain a real nested translation change when shared rows reorder', () => {
    const workingData = structuredClone(attachmentData)

    workingData.rows.reverse()
    workingData.rows[0]!.blocks.reverse()
    workingData.rows[0]!.blocks[0]!.items.reverse()
    workingData.rows[0]!.blocks[0]!.items[0]!.title.en = 'Changed translation'

    const result = planLegacyBranchHeads({
      fields: attachmentFields,
      locales: ['en', 'fr'],
      materialized: { data: attachmentData, version: live.version },
      statusMode: 'localized',
      working: { data: workingData, version: { generation: 1, id: 'changed-translation' } },
    })

    expect(
      result.heads.filter(({ branchID }) => branchID === 'drafts').map(({ scope }) => scope),
    ).toStrictEqual([{ type: 'shared' }, { locale: 'en', type: 'locale' }])
  })

  it('should preserve ordering within localized atomic containers', () => {
    const workingData = structuredClone(attachmentData)

    workingData.rows[0]!.localizedItems.en.reverse()

    const result = planLegacyBranchHeads({
      fields: attachmentFields,
      locales: ['en', 'fr'],
      materialized: { data: attachmentData, version: live.version },
      statusMode: 'localized',
      working: { data: workingData, version: { generation: 1, id: 'localized-order' } },
    })

    expect(
      result.heads.filter(({ branchID }) => branchID === 'drafts').map(({ scope }) => scope),
    ).toStrictEqual([{ locale: 'en', type: 'locale' }])
  })

  it('should distinguish numeric and string row identities when comparing translations', () => {
    const workingData = structuredClone(attachmentData)

    workingData.rows.reverse()
    workingData.rows[0]!.title.en = 'Translation for string identity'

    const result = planLegacyBranchHeads({
      fields: attachmentFields,
      locales: ['en', 'fr'],
      materialized: { data: attachmentData, version: live.version },
      statusMode: 'localized',
      working: { data: workingData, version: { generation: 1, id: 'typed-row-change' } },
    })

    expect(
      result.heads.filter(({ branchID }) => branchID === 'drafts').map(({ scope }) => scope),
    ).toStrictEqual([{ type: 'shared' }, { locale: 'en', type: 'locale' }])
  })

  it.each(['bad', [], 'published'])(
    'should reject malformed localized publication state %j',
    (_status) => {
      expect(() =>
        planLegacyBranchHeads({
          fields,
          locales: ['en', 'fr'],
          materialized: { ...live, data: { ...live.data, _status } },
          statusMode: 'localized',
          working: null,
        }),
      ).toThrow('publication state')
    },
  )

  it('should reject duplicate locales and managed branch identity collisions', () => {
    expect(() =>
      planLegacyBranchHeads({
        fields,
        locales: ['en', 'en'],
        materialized: live,
        statusMode: 'localized',
        working: null,
      }),
    ).toThrow('distinct nonempty')
    expect(() =>
      planLegacyBranchHeads({
        draftsBranchID: 'main',
        fields,
        locales: ['en'],
        materialized: live,
        statusMode: 'localized',
        working: null,
      }),
    ).toThrow('different identities')
  })

  it('should produce the same plan on retry without changing source data', () => {
    const materialized = structuredClone(live)
    const before = structuredClone(materialized)
    const input = {
      fields,
      locales: ['en', 'fr'],
      materialized,
      statusMode: 'localized' as const,
      working: null,
    }
    const first = planLegacyBranchHeads(input)

    expect(planLegacyBranchHeads(input)).toStrictEqual(first)
    expect(materialized).toStrictEqual(before)
  })
})
