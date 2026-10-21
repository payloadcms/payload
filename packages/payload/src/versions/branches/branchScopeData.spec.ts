import { describe, expect, it } from 'vitest'

import type { Block, Field } from '../../fields/config/types.js'

import { compileBranchScopeFields } from './compileBranchScopeFields.js'
import { composeBranchScopeData } from './composeBranchScopeData.js'
import { projectBranchScopeData } from './projectBranchScopeData.js'

describe('branch content scopes', () => {
  it('should select locale data without treating arbitrary JSON keys as locales', () => {
    const fields = compileBranchScopeFields({
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'json', type: 'json' },
        { name: 'localizedJSON', type: 'json', localized: true },
      ],
    })
    const data = {
      json: { en: 'ordinary key', nested: { fr: 'also ordinary' } },
      localizedJSON: { en: { fr: 'inside English JSON' }, fr: { en: 'inside French JSON' } },
      title: { en: 'English', fr: 'French' },
    }

    expect(projectBranchScopeData({ data, fields, scope: { type: 'shared' } })).toStrictEqual({
      json: data.json,
    })
    expect(
      projectBranchScopeData({ data, fields, scope: { locale: 'en', type: 'locale' } }),
    ).toStrictEqual({
      localizedJSON: { en: { fr: 'inside English JSON' } },
      title: { en: 'English' },
    })
  })

  it('should publish English from one version while retaining live French and shared content', () => {
    const fields = compileBranchScopeFields({
      fields: [
        { name: 'shared', type: 'text' },
        { name: 'title', type: 'text', localized: true },
      ],
    })
    const live = { shared: 'live shared', title: { en: 'old English', fr: 'live French' } }
    const working = {
      shared: 'unreviewed shared',
      title: { en: 'new English', fr: 'French draft' },
    }
    const result = composeBranchScopeData({
      fields,
      locales: [
        {
          data: projectBranchScopeData({
            data: working,
            fields,
            scope: { locale: 'en', type: 'locale' },
          }),
          locale: 'en',
        },
        {
          data: projectBranchScopeData({
            data: live,
            fields,
            scope: { locale: 'fr', type: 'locale' },
          }),
          locale: 'fr',
        },
      ],
      shared: projectBranchScopeData({ data: live, fields, scope: { type: 'shared' } }),
    })

    expect(result).toStrictEqual({
      shared: 'live shared',
      title: { en: 'new English', fr: 'live French' },
    })
    expect(working.shared).toBe('unreviewed shared')
  })

  it('should preserve explicit null and absence independently without locale fallback', () => {
    const fields = compileBranchScopeFields({
      fields: [{ name: 'title', type: 'text', localized: true }],
    })
    const result = composeBranchScopeData({
      fields,
      locales: [
        {
          data: projectBranchScopeData({
            data: { title: { en: null } },
            fields,
            scope: { locale: 'en', type: 'locale' },
          }),
          locale: 'en',
        },
        { data: {}, locale: 'fr' },
      ],
      shared: {},
    })

    expect(result).toStrictEqual({ title: { en: null } })
    expect(Object.hasOwn(result.title as object, 'fr')).toBe(false)
  })

  it('should attach localized array values by row identity while preserving shared ordering', () => {
    const fields = compileBranchScopeFields({ fields: [arrayField] })
    const live = {
      rows: [
        { id: 'b', label: 'B live', title: { en: 'B English', fr: 'B French' } },
        { id: 'a', label: 'A live', title: { en: 'A English', fr: 'A French' } },
      ],
    }
    const working = {
      rows: [
        { id: 'a', label: 'A draft', title: { en: 'A ready', fr: 'A unreviewed' } },
        { id: 'b', label: 'B draft', title: { en: 'B ready', fr: 'B unreviewed' } },
      ],
    }
    const result = composeBranchScopeData({
      fields,
      locales: [
        {
          data: projectBranchScopeData({
            data: working,
            fields,
            scope: { locale: 'en', type: 'locale' },
          }),
          locale: 'en',
        },
        {
          data: projectBranchScopeData({
            data: live,
            fields,
            scope: { locale: 'fr', type: 'locale' },
          }),
          locale: 'fr',
        },
      ],
      shared: projectBranchScopeData({ data: live, fields, scope: { type: 'shared' } }),
    })

    expect(result.rows).toStrictEqual([
      { id: 'b', label: 'B live', title: { en: 'B ready', fr: 'B French' } },
      { id: 'a', label: 'A live', title: { en: 'A ready', fr: 'A French' } },
    ])
  })

  it.each([
    [{ id: 'different', title: { en: 'draft' } }],
    [{ title: { en: 'draft' } }],
    [{ id: 1, title: { en: 'draft' } }],
    [],
    null,
  ])('should reject incompatible locale row structure %j', (rows) => {
    const fields = compileBranchScopeFields({ fields: [arrayField] })

    expect(() =>
      composeBranchScopeData({
        fields,
        locales: [{ data: { rows }, locale: 'en' }],
        shared: { rows: [{ id: '1', label: 'live' }] },
      }),
    ).toThrow(/row (structure|identity)/)
  })

  it('should reject duplicate row IDs instead of assigning multiple translations to one row', () => {
    const fields = compileBranchScopeFields({ fields: [arrayField] })

    expect(() =>
      composeBranchScopeData({
        fields,
        locales: [{ data: { rows: [{ id: 'a' }, { id: 'a' }] }, locale: 'en' }],
        shared: { rows: [{ id: 'a' }, { id: 'a' }] },
      }),
    ).toThrow('Duplicate shared row identity')
  })

  it('should keep localized containers atomic including rich text and localized arrays', () => {
    const fields = compileBranchScopeFields({
      fields: [
        {
          name: 'group',
          type: 'group',
          localized: true,
          fields: [{ name: 'nested', type: 'text', localized: true }],
        },
        { ...arrayField, localized: true },
        { name: 'content', type: 'richText', localized: true },
      ],
    })
    const data = {
      content: {
        en: { root: { children: [{ text: 'English' }] } },
        fr: { root: { children: [] } },
      },
      group: { en: { nested: 'already localized by parent' }, fr: { nested: 'French' } },
      rows: { en: [{ id: 'a', title: 'English row' }], fr: [] },
    }
    const projected = projectBranchScopeData({
      data,
      fields,
      scope: { locale: 'en', type: 'locale' },
    })
    const result = composeBranchScopeData({
      fields,
      locales: [{ data: projected, locale: 'en' }],
      shared: {},
    })

    expect(result).toStrictEqual({
      content: { en: data.content.en },
      group: { en: data.group.en },
      rows: { en: data.rows.en },
    })
  })

  it('should compile named tabs and flatten unnamed containers', () => {
    const fields = compileBranchScopeFields({
      fields: [
        { type: 'row', fields: [{ name: 'shared', type: 'text' }] },
        {
          type: 'tabs',
          tabs: [
            { label: 'Unnamed', fields: [{ name: 'flat', type: 'text', localized: true }] },
            { name: 'named', fields: [{ name: 'title', type: 'text', localized: true }] },
          ],
        },
      ],
    })

    expect(
      projectBranchScopeData({
        data: { flat: { en: 'flat' }, named: { title: { en: 'nested' } }, shared: 'shared' },
        fields,
        scope: { locale: 'en', type: 'locale' },
      }),
    ).toStrictEqual({ flat: { en: 'flat' }, named: { title: { en: 'nested' } } })
  })

  it('should resolve referenced blocks and preserve shared block metadata', () => {
    const fields = compileBranchScopeFields({
      blocks: [{ slug: 'text', fields: [{ name: 'title', type: 'text', localized: true }] }],
      fields: [{ name: 'layout', type: 'blocks', blocks: ['text'] }],
    })
    const live = {
      layout: [{ id: 'a', blockName: 'Live name', blockType: 'text', title: { fr: 'French' } }],
    }
    const working = {
      layout: [
        { id: 'a', blockName: 'Unreviewed name', blockType: 'text', title: { en: 'English' } },
      ],
    }
    const result = composeBranchScopeData({
      fields,
      locales: [
        {
          data: projectBranchScopeData({
            data: working,
            fields,
            scope: { locale: 'en', type: 'locale' },
          }),
          locale: 'en',
        },
        {
          data: projectBranchScopeData({
            data: live,
            fields,
            scope: { locale: 'fr', type: 'locale' },
          }),
          locale: 'fr',
        },
      ],
      shared: projectBranchScopeData({ data: live, fields, scope: { type: 'shared' } }),
    })

    expect(result.layout).toStrictEqual([
      {
        id: 'a',
        blockName: 'Live name',
        blockType: 'text',
        title: { en: 'English', fr: 'French' },
      },
    ])
  })

  it('should compile recursive block references without recursively expanding the schema', () => {
    const node: Block = {
      slug: 'node',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'children', type: 'blocks', blocks: ['node'] },
      ],
    }
    const fields = compileBranchScopeFields({
      blocks: [node],
      fields: [{ name: 'tree', type: 'blocks', blocks: ['node'] }],
    })
    const data = {
      tree: [
        {
          id: 'parent',
          blockType: 'node',
          title: { en: 'Parent' },
          children: [{ id: 'child', blockType: 'node', title: { en: 'Child' }, children: [] }],
        },
      ],
    }

    expect(
      projectBranchScopeData({ data, fields, scope: { locale: 'en', type: 'locale' } }),
    ).toStrictEqual(data)
  })

  it('should omit system and virtual data from content scope payloads', () => {
    const fields = compileBranchScopeFields({
      fields: [
        { name: 'id', type: 'text' },
        { name: '_status', type: 'text' },
        { name: 'createdAt', type: 'date' },
        { name: 'updatedAt', type: 'date' },
        { name: 'computed', type: 'text', virtual: true },
        { name: 'title', type: 'text' },
      ],
    })

    expect(
      projectBranchScopeData({
        data: { id: 'id', _status: 'draft', computed: 'computed', title: 'content' },
        fields,
        scope: { type: 'shared' },
      }),
    ).toStrictEqual({ title: 'content' })
  })

  it('should omit shared only arrays from locale fragments', () => {
    const fields = compileBranchScopeFields({
      fields: [{ name: 'rows', type: 'array', fields: [{ name: 'label', type: 'text' }] }],
    })

    expect(
      projectBranchScopeData({
        data: { rows: [{ id: 'a', label: 'shared' }] },
        fields,
        scope: { locale: 'en', type: 'locale' },
      }),
    ).toStrictEqual({})
  })

  it('should refuse unresolved block references and unknown stored block types', () => {
    expect(() =>
      compileBranchScopeFields({
        fields: [{ name: 'layout', type: 'blocks', blocks: ['missing'] }],
      }),
    ).toThrow('Missing block definition')

    const fields = compileBranchScopeFields({
      fields: [{ name: 'layout', type: 'blocks', blocks: [] }],
    })

    expect(() =>
      projectBranchScopeData({
        data: { layout: [{ id: 'a', blockType: 'missing' }] },
        fields,
        scope: { type: 'shared' },
      }),
    ).toThrow('Unknown block type')
  })

  it('should reject duplicate locale inputs', () => {
    expect(() =>
      composeBranchScopeData({
        fields: [],
        locales: [
          { data: {}, locale: 'en' },
          { data: {}, locale: 'en' },
        ],
        shared: {},
      }),
    ).toThrow('A locale may only be selected once')
  })

  it('should clone payload values instead of sharing mutable content with source versions', () => {
    const fields = compileBranchScopeFields({ fields: [{ name: 'json', type: 'json' }] })
    const data = { json: { nested: ['original'] } }
    const result = projectBranchScopeData({ data, fields, scope: { type: 'shared' } })

    ;(result.json as typeof data.json).nested.push('changed')

    expect(data.json.nested).toStrictEqual(['original'])
  })

  it('should keep shared block names out of locale change detection', () => {
    const fields = compileBranchScopeFields({
      fields: [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [{ slug: 'text', fields: [{ name: 'title', type: 'text', localized: true }] }],
        },
      ],
    })
    const live = {
      layout: [{ id: 'a', blockName: 'Live', blockType: 'text', title: { en: 'unchanged' } }],
    }
    const working = {
      layout: [
        { id: 'a', blockName: 'Shared draft', blockType: 'text', title: { en: 'unchanged' } },
      ],
    }

    expect(
      projectBranchScopeData({ data: working, fields, scope: { locale: 'en', type: 'locale' } }),
    ).toStrictEqual(
      projectBranchScopeData({ data: live, fields, scope: { locale: 'en', type: 'locale' } }),
    )
    expect(
      projectBranchScopeData({ data: working, fields, scope: { type: 'shared' } }),
    ).not.toStrictEqual(projectBranchScopeData({ data: live, fields, scope: { type: 'shared' } }))
  })
})

const arrayField: Field = {
  name: 'rows',
  type: 'array',
  fields: [
    { name: 'label', type: 'text' },
    { name: 'title', type: 'text', localized: true },
  ],
}
