import { describe, expect, it } from 'vitest'

import type { Field } from '../../fields/config/types.js'

import { hasNonLocalizedDataChanged } from './hasNonLocalizedDataChanged.js'

const fields: Field[] = [
  {
    name: 'title',
    type: 'text',
    localized: true,
  },
  {
    name: 'summary',
    type: 'text',
  },
  {
    name: 'content',
    type: 'richText',
  },
  {
    name: 'meta',
    type: 'group',
    fields: [
      {
        name: 'localizedDescription',
        type: 'text',
        localized: true,
      },
      {
        name: 'sharedDescription',
        type: 'text',
      },
    ],
  },
  {
    name: 'rows',
    type: 'array',
    fields: [
      {
        name: 'localizedLabel',
        type: 'text',
        localized: true,
      },
      {
        name: 'sharedLabel',
        type: 'text',
      },
    ],
  },
  {
    name: 'blocks',
    type: 'blocks',
    blocks: [
      {
        slug: 'textBlock',
        fields: [
          {
            name: 'localizedBlockText',
            type: 'text',
            localized: true,
          },
          {
            name: 'sharedBlockText',
            type: 'text',
          },
        ],
      },
    ],
  },
]

describe('hasNonLocalizedDataChanged', () => {
  it.each([
    { after: { b: 2, a: 1 }, before: { a: 1, b: 2 }, hasChanged: false },
    { after: { a: 1 }, before: { a: 1, b: undefined }, hasChanged: false },
    { after: [1, 2], before: [1, undefined, 2], hasChanged: false },
    { after: [2, 1], before: [1, 2], hasChanged: true },
    { after: null, before: undefined, hasChanged: true },
    { after: '', before: null, hasChanged: true },
    { after: false, before: null, hasChanged: true },
    { after: 0, before: null, hasChanged: true },
  ])('should compare shared JSON values $before and $after', ({ after, before, hasChanged }) => {
    expect(
      hasNonLocalizedDataChanged({
        after: { value: after },
        before: { value: before },
        configBlockReferences: [],
        fields: [{ name: 'value', type: 'json' }],
      }),
    ).toBe(hasChanged)
  })

  it.each(['rows', 'blocks'] as const)('should detect reordering shared %s', (field) => {
    const rows = ['one', 'two'].map((id) => ({
      id,
      ...(field === 'blocks' ? { blockType: 'textBlock' } : {}),
    }))

    expect(
      hasNonLocalizedDataChanged({
        after: { [field]: [...rows].reverse() },
        before: { [field]: rows },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(true)
  })

  it('should treat missing and null row metadata equally with sanitized fields', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: { rows: [{ id: null, text: 'Shared' }] },
        before: { rows: [{ text: 'Shared' }] },
        configBlockReferences: [],
        fields: [
          {
            name: 'rows',
            type: 'array',
            fields: [
              { name: 'id', type: 'text' },
              { name: 'text', type: 'text' },
            ],
          },
        ],
      }),
    ).toBe(false)
  })

  it.each([
    { hasChanged: false, localizedText: 'Draft', sharedText: 'Shared' },
    { hasChanged: true, localizedText: 'Published', sharedText: 'Changed' },
  ])(
    'should compare shared children of referenced blocks ($hasChanged)',
    ({ hasChanged, ...after }) => {
      const block = {
        slug: 'reference',
        fields: [
          { name: 'localizedText', type: 'text', localized: true },
          { name: 'sharedText', type: 'text' },
        ],
      } as const

      expect(
        hasNonLocalizedDataChanged({
          after: { blocks: [{ id: 'one', blockType: block.slug, ...after }] },
          before: {
            blocks: [
              {
                id: 'one',
                blockType: block.slug,
                localizedText: 'Published',
                sharedText: 'Shared',
              },
            ],
          },
          configBlockReferences: [{ ...block, fields: [...block.fields], flattenedFields: [] }],
          fields: [{ name: 'blocks', type: 'blocks', blocks: [block.slug] }],
        }),
      ).toBe(hasChanged)
    },
  )

  it.each([false, true])('should compare shared children of named tabs (%s)', (hasChanged) => {
    expect(
      hasNonLocalizedDataChanged({
        after: { tab: { sharedText: hasChanged ? 'Changed' : 'Shared', localizedText: 'Draft' } },
        before: { tab: { sharedText: 'Shared', localizedText: 'Published' } },
        configBlockReferences: [],
        fields: [
          {
            type: 'tabs',
            tabs: [
              {
                name: 'tab',
                fields: [
                  { name: 'sharedText', type: 'text' },
                  { name: 'localizedText', type: 'text', localized: true },
                ],
              },
            ],
          },
        ],
      }),
    ).toBe(hasChanged)
  })

  it.each(['group', 'array'] as const)('should ignore children of a localized %s', (type) => {
    expect(
      hasNonLocalizedDataChanged({
        after: { container: { en: type === 'group' ? { text: 'Draft' } : [{ text: 'Draft' }] } },
        before: {
          container: { en: type === 'group' ? { text: 'Published' } : [{ text: 'Published' }] },
        },
        configBlockReferences: [],
        fields: [
          { name: 'container', type, localized: true, fields: [{ name: 'text', type: 'text' }] },
        ],
      }),
    ).toBe(false)
  })

  it('should ignore localized field changes', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          title: { en: 'Draft EN', es: 'Published ES' },
          summary: 'Shared',
        },
        before: {
          title: { en: 'Published EN', es: 'Published ES' },
          summary: 'Shared',
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(false)
  })

  it('should detect non-localized scalar field changes', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          summary: 'Shared draft',
        },
        before: {
          summary: 'Shared published',
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(true)
  })

  it('should detect rich-text-like non-localized object changes', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          content: {
            root: {
              children: [{ text: 'Draft rich text', type: 'text' }],
              type: 'root',
            },
          },
        },
        before: {
          content: {
            root: {
              children: [{ text: 'Published rich text', type: 'text' }],
              type: 'root',
            },
          },
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(true)
  })

  it('should compare non-localized children inside non-localized groups', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          meta: {
            localizedDescription: { en: 'Draft EN' },
            sharedDescription: 'Shared draft',
          },
        },
        before: {
          meta: {
            localizedDescription: { en: 'Published EN' },
            sharedDescription: 'Shared published',
          },
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(true)
  })

  it('should ignore localized children inside non-localized groups', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          meta: {
            localizedDescription: { en: 'Draft EN' },
            sharedDescription: 'Shared',
          },
        },
        before: {
          meta: {
            localizedDescription: { en: 'Published EN' },
            sharedDescription: 'Shared',
          },
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(false)
  })

  it('should ignore empty non-localized groups when the stored document omits them', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          meta: {},
          title: { en: 'Draft EN' },
        },
        before: {
          title: { en: 'Published EN' },
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(false)
  })

  it('should ignore empty non-localized arrays when the stored document omits them', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          rows: [],
          title: { en: 'Draft EN' },
        },
        before: {
          title: { en: 'Published EN' },
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(false)
  })

  it('should detect non-localized array structure changes', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          rows: [
            { id: 'row-1', sharedLabel: 'One' },
            { id: 'row-2', sharedLabel: 'Two' },
          ],
        },
        before: {
          rows: [{ id: 'row-1', sharedLabel: 'One' }],
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(true)
  })

  it('should detect removing all rows from a non-localized array', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          rows: [],
        },
        before: {
          rows: [{ id: 'row-1', sharedLabel: 'One' }],
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(true)
  })

  it('should ignore localized child changes inside existing non-localized array rows', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          rows: [{ id: 'row-1', localizedLabel: { en: 'Draft EN' }, sharedLabel: 'One' }],
        },
        before: {
          rows: [{ id: 'row-1', localizedLabel: { en: 'Published EN' }, sharedLabel: 'One' }],
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(false)
  })

  it('should detect non-localized block structure changes', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          blocks: [
            {
              blockType: 'textBlock',
              id: 'block-1',
              sharedBlockText: 'One',
            },
          ],
        },
        before: {
          blocks: [],
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(true)
  })

  it('should detect removing all rows from a non-localized blocks field', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          blocks: [],
        },
        before: {
          blocks: [
            {
              blockType: 'textBlock',
              id: 'block-1',
              sharedBlockText: 'One',
            },
          ],
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(true)
  })

  it('should ignore localized child changes inside existing non-localized blocks', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          blocks: [
            {
              blockType: 'textBlock',
              id: 'block-1',
              localizedBlockText: { en: 'Draft EN' },
              sharedBlockText: 'Shared',
            },
          ],
        },
        before: {
          blocks: [
            {
              blockType: 'textBlock',
              id: 'block-1',
              localizedBlockText: { en: 'Published EN' },
              sharedBlockText: 'Shared',
            },
          ],
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(false)
  })

  it('should ignore undefined values when comparing non-localized data', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: {
          meta: {
            sharedDescription: undefined,
          },
          rows: [{ id: 'row-1', sharedLabel: 'One' }, undefined],
          summary: 'Shared',
        },
        before: {
          meta: {},
          rows: [{ id: 'row-1', sharedLabel: 'One' }],
          summary: 'Shared',
        },
        configBlockReferences: [],
        fields,
      }),
    ).toBe(false)
  })
})

describe('virtual fields', () => {
  it('should ignore computed virtual values absent from stored data', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: { computed: 'Computed value' },
        before: {},
        configBlockReferences: [],
        fields: [{ name: 'computed', type: 'text', virtual: true }],
      }),
    ).toBe(false)
  })

  it('should ignore children of virtual named tabs', () => {
    expect(
      hasNonLocalizedDataChanged({
        after: { computed: { text: 'Computed value' } },
        before: {},
        configBlockReferences: [],
        fields: [
          {
            type: 'tabs',
            tabs: [{ name: 'computed', virtual: true, fields: [{ name: 'text', type: 'text' }] }],
          },
        ],
      }),
    ).toBe(false)
  })
})
