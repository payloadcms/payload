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
  it('returns false for a top-level non-localized field', () => {
    expect(
      isValidationErrorPathLocalized({ configBlockReferences: [], data, fields, path: 'shared' }),
    ).toBe(false)
  })

  it('returns true for a top-level localized field', () => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'localizedJSON',
      }),
    ).toBe(true)
  })

  it('returns true for any field nested inside a localized group, regardless of its own flag', () => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'localizedGroup.value',
      }),
    ).toBe(true)
  })

  it('returns false for a non-localized field nested inside a non-localized group', () => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'nested.shared',
      }),
    ).toBe(false)
  })

  it('returns true for a localized field nested inside a non-localized group', () => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'nested.localizedJSON',
      }),
    ).toBe(true)
  })

  it('resolves array row indices without consuming a field name', () => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'nestedArray.0.shared',
      }),
    ).toBe(false)
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'nestedArray.0.localizedJSON',
      }),
    ).toBe(true)
  })

  it('resolves blocks row indices via the row blockType', () => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'nestedBlocks.0.shared',
      }),
    ).toBe(false)
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'nestedBlocks.0.localizedJSON',
      }),
    ).toBe(true)
  })

  it('sees through unnamed presentational row fields', () => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'rowShared',
      }),
    ).toBe(false)
  })

  it('resolves named and unnamed tabs', () => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'localizedTab.value',
      }),
    ).toBe(true)
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'unnamedTabShared',
      }),
    ).toBe(false)
  })

  it('conservatively treats an unresolvable path as localized', () => {
    expect(
      isValidationErrorPathLocalized({
        configBlockReferences: [],
        data,
        fields,
        path: 'doesNotExist',
      }),
    ).toBe(true)
  })
})
