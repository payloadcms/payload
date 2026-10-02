import type { Field, FlattenedBlock } from '../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { flattenDataByLocale } from './flattenDataByLocale.js'

const localizedText = (name: string): Field => ({
  name,
  type: 'text',
})

describe('flattenDataByLocale', () => {
  it('should recursively flatten localized arrays, blocks, groups, named tabs, and referenced blocks', () => {
    const referencedBlock = {
      fields: [localizedText('referencedText')],
      slug: 'referenced',
    } as FlattenedBlock
    const fields: Field[] = [
      {
        name: 'localizedArray',
        type: 'array',
        fields: [localizedText('arrayText')],
        localized: true,
      },
      {
        name: 'localizedBlocks',
        type: 'blocks',
        blocks: [
          {
            fields: [localizedText('inlineText')],
            slug: 'inline',
          },
        ],
        localized: true,
      },
      {
        name: 'localizedGroup',
        type: 'group',
        fields: [localizedText('groupText')],
        localized: true,
      },
      {
        type: 'tabs',
        tabs: [
          {
            name: 'localizedTab',
            fields: [localizedText('tabText')],
            localized: true,
          },
        ],
      },
      {
        name: 'localizedReferencedBlocks',
        type: 'blocks',
        blocks: ['referenced'],
        localized: true,
      },
    ]

    const result = flattenDataByLocale({
      configBlockReferences: [referencedBlock],
      docWithLocales: {
        localizedArray: {
          en: [{ arrayText: 'array en', id: 'array-en' }],
          es: [{ arrayText: 'array es', id: 'array-es' }],
        },
        localizedBlocks: {
          en: [{ blockType: 'inline', id: 'inline-en', inlineText: 'inline en' }],
          es: [{ blockType: 'inline', id: 'inline-es', inlineText: 'inline es' }],
        },
        localizedGroup: {
          en: { groupText: 'group en' },
          es: { groupText: 'group es' },
        },
        localizedReferencedBlocks: {
          en: [
            {
              blockType: 'referenced',
              id: 'referenced-en',
              referencedText: 'referenced en',
            },
          ],
          es: [
            {
              blockType: 'referenced',
              id: 'referenced-es',
              referencedText: 'referenced es',
            },
          ],
        },
        localizedTab: {
          en: { tabText: 'tab en' },
          es: { tabText: 'tab es' },
        },
      },
      fields,
      locale: 'es',
    })

    expect(result).toEqual({
      localizedArray: [{ arrayText: 'array es', id: 'array-es' }],
      localizedBlocks: [{ blockType: 'inline', id: 'inline-es', inlineText: 'inline es' }],
      localizedGroup: { groupText: 'group es' },
      localizedReferencedBlocks: [
        {
          blockType: 'referenced',
          id: 'referenced-es',
          referencedText: 'referenced es',
        },
      ],
      localizedTab: { tabText: 'tab es' },
    })
  })

  it('should convert stored point representations at top-level and nested paths', () => {
    const referencedBlock = {
      fields: [{ name: 'referencedPoint', type: 'point' }],
      slug: 'point-reference',
    } as FlattenedBlock
    const fields: Field[] = [
      {
        name: 'localizedPoint',
        type: 'point',
        localized: true,
      },
      {
        name: 'pointGroup',
        type: 'group',
        fields: [{ name: 'groupPoint', type: 'point' }],
      },
      {
        name: 'pointArray',
        type: 'array',
        fields: [{ name: 'arrayPoint', type: 'point' }],
      },
      {
        name: 'pointBlocks',
        type: 'blocks',
        blocks: ['point-reference'],
      },
    ]

    const result = flattenDataByLocale({
      configBlockReferences: [referencedBlock],
      docWithLocales: {
        localizedPoint: {
          en: { coordinates: [1, 2], type: 'Point' },
          es: { coordinates: [3, 4], type: 'Point' },
        },
        pointArray: [
          {
            arrayPoint: { coordinates: [7, 8], type: 'Point' },
            id: 'point-row',
          },
        ],
        pointBlocks: [
          {
            blockType: 'point-reference',
            id: 'point-block',
            referencedPoint: { coordinates: [9, 10], type: 'Point' },
          },
        ],
        pointGroup: {
          groupPoint: { coordinates: [5, 6], type: 'Point' },
        },
      },
      fields,
      locale: 'es',
    })

    expect(result).toEqual({
      localizedPoint: [3, 4],
      pointArray: [{ arrayPoint: [7, 8], id: 'point-row' }],
      pointBlocks: [
        {
          blockType: 'point-reference',
          id: 'point-block',
          referencedPoint: [9, 10],
        },
      ],
      pointGroup: { groupPoint: [5, 6] },
    })
  })

  it('should not mistake a candidate sub-field named after a locale code for a locale map', () => {
    const fields: Field[] = [
      {
        name: 'localizedGroup',
        type: 'group',
        fields: [localizedText('en'), localizedText('title')],
        localized: true,
      },
    ]

    const result = flattenDataByLocale({
      configBlockReferences: [],
      dataIsLocaleKeyed: false,
      docWithLocales: {
        localizedGroup: {
          en: 'sneaky value',
          title: 'Hi',
        },
      },
      fields,
      locale: 'en',
    })

    expect(result).toEqual({
      localizedGroup: {
        en: 'sneaky value',
        title: 'Hi',
      },
    })
  })

  it('should still unwrap a locale-keyed value whose keys happen to include ordinary field names', () => {
    const fields: Field[] = [
      {
        name: 'localizedGroup',
        type: 'group',
        fields: [localizedText('en'), localizedText('title')],
        localized: true,
      },
    ]

    const result = flattenDataByLocale({
      configBlockReferences: [],
      docWithLocales: {
        localizedGroup: {
          en: { en: 'English en value', title: 'English title' },
          es: { en: 'Spanish en value', title: 'Spanish title' },
        },
      },
      fields,
      locale: 'es',
    })

    expect(result).toEqual({
      localizedGroup: { en: 'Spanish en value', title: 'Spanish title' },
    })
  })
})
