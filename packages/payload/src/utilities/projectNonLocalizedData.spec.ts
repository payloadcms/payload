import type { Field } from '../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { projectNonLocalizedData } from './projectNonLocalizedData.js'

describe('projectNonLocalizedData', () => {
  it('should omit every localized schema branch while preserving nested non-localized data', () => {
    const fields: Field[] = [
      {
        name: 'localizedGroup',
        type: 'group',
        fields: [{ name: 'value', type: 'text' }],
        localized: true,
      },
      { name: 'localizedJSON', type: 'json', localized: true },
      { name: 'localizedRichText', type: 'richText', localized: true },
      {
        type: 'tabs',
        tabs: [
          {
            name: 'localizedTab',
            fields: [{ name: 'value', type: 'text' }],
            localized: true,
          },
        ],
      },
      {
        name: 'localizedArray',
        type: 'array',
        fields: [{ name: 'value', type: 'text' }],
        localized: true,
      },
      {
        name: 'localizedBlocks',
        type: 'blocks',
        blocks: [
          {
            slug: 'example',
            fields: [{ name: 'value', type: 'text' }],
          },
        ],
        localized: true,
      },
      {
        name: 'nested',
        type: 'group',
        fields: [
          { name: 'localizedJSON', type: 'json', localized: true },
          { name: 'shared', type: 'text' },
        ],
      },
      {
        name: 'nestedArray',
        type: 'array',
        fields: [
          { name: 'localizedJSON', type: 'json', localized: true },
          { name: 'shared', type: 'text' },
        ],
      },
      {
        name: 'nestedBlocks',
        type: 'blocks',
        blocks: [
          {
            slug: 'nested',
            fields: [
              { name: 'localizedJSON', type: 'json', localized: true },
              { name: 'shared', type: 'text' },
            ],
          },
        ],
      },
    ]
    const data = {
      _status: 'published',
      localizedArray: [{ value: 'active array' }],
      localizedBlocks: [{ blockType: 'example', value: 'active block' }],
      localizedGroup: { value: 'active group' },
      localizedJSON: { value: 'active JSON' },
      localizedRichText: { root: { children: [] } },
      localizedTab: { value: 'active tab' },
      nested: {
        localizedJSON: { value: 'active nested JSON' },
        shared: 'shared value',
      },
      nestedArray: [
        {
          localizedJSON: { value: 'active array JSON' },
          shared: 'shared array value',
        },
      ],
      nestedBlocks: [
        {
          blockType: 'nested',
          localizedJSON: { value: 'active block JSON' },
          shared: 'shared block value',
        },
      ],
    }

    expect(
      projectNonLocalizedData({
        configBlockReferences: [],
        data,
        fields,
      }),
    ).toEqual({
      _status: 'published',
      nested: {
        shared: 'shared value',
      },
      nestedArray: [
        {
          shared: 'shared array value',
        },
      ],
      nestedBlocks: [
        {
          blockType: 'nested',
          shared: 'shared block value',
        },
      ],
    })
    expect(data.localizedJSON).toEqual({ value: 'active JSON' })
    expect(data.nested.localizedJSON).toEqual({ value: 'active nested JSON' })
  })
})
