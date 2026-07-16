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
