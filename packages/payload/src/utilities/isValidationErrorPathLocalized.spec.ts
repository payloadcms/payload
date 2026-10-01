import type { Field } from '../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { isValidationErrorPathLocalized } from './isValidationErrorPathLocalized.js'

const fields: Field[] = [
  { name: 'shared', type: 'text' },
  { name: 'localizedJSON', type: 'json', localized: true },
  {
    name: 'localizedGroup',
    type: 'group',
    fields: [{ name: 'value', type: 'text' }],
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
  {
    type: 'row',
    fields: [{ name: 'rowShared', type: 'text' }],
  },
  {
    type: 'tabs',
    tabs: [
      {
        name: 'localizedTab',
        fields: [{ name: 'value', type: 'text' }],
        localized: true,
      },
      {
        fields: [{ name: 'unnamedTabShared', type: 'text' }],
      },
    ],
  },
]

const data = {
  shared: 'shared value',
  localizedJSON: { value: 'active JSON' },
  localizedGroup: { value: 'active group' },
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
  rowShared: 'row value',
  unnamedTabShared: 'unnamed tab value',
}

describe('isValidationErrorPathLocalized', () => {
  it.each([
    ['a top-level non-localized field', 'shared', false],
    ['a top-level localized field', 'localizedJSON', true],
    ['a field inside a localized group', 'localizedGroup.value', true],
    ['a shared field inside a group', 'nested.shared', false],
    ['a localized field inside a group', 'nested.localizedJSON', true],
    ['a shared field inside an array row', 'nestedArray.0.shared', false],
    ['a localized field inside an array row', 'nestedArray.0.localizedJSON', true],
    ['a shared field inside a block row', 'nestedBlocks.0.shared', false],
    ['a localized field inside a block row', 'nestedBlocks.0.localizedJSON', true],
    ['a field inside a presentational row', 'rowShared', false],
    ['a field inside a localized named tab', 'localizedTab.value', true],
    ['a field inside an unnamed tab', 'unnamedTabShared', false],
    ['an unresolvable path', 'doesNotExist', true],
  ])('should identify %s at %s as localized=%s', (_description, path, expected) => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path,
      }),
    ).toBe(expected)
  })
})
