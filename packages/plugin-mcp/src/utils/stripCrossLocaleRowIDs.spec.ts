import type { FlattenedBlock, FlattenedField } from 'payload'

import { describe, expect, it } from 'vitest'

import {
  entityHasLocalizedRowContainers,
  stripCrossLocaleRowIDs,
} from './stripCrossLocaleRowIDs.js'

const text = (name: string, localized?: boolean): FlattenedField =>
  ({ name, type: 'text', ...(localized ? { localized } : {}) }) as FlattenedField

const array = (
  name: string,
  flattenedFields: FlattenedField[],
  localized?: boolean,
): FlattenedField =>
  ({
    name,
    type: 'array',
    flattenedFields,
    ...(localized ? { localized } : {}),
  }) as FlattenedField

const localizedItemsFields: FlattenedField[] = [
  text('title'),
  array('items', [text('label'), text('id')], true),
  array('rows', [text('label', true), text('id')]),
]

describe('stripCrossLocaleRowIDs', () => {
  it('should strip row ids of a localized array that do not exist in the target locale', () => {
    const data = {
      items: [
        { id: 'from-other-locale', label: 'one' },
        { id: 'existing-in-locale', label: 'two' },
      ],
    }

    stripCrossLocaleRowIDs({
      data,
      existingDoc: { items: [{ id: 'existing-in-locale', label: 'old' }] },
      fields: localizedItemsFields,
    })

    expect(data.items).toEqual([{ label: 'one' }, { id: 'existing-in-locale', label: 'two' }])
  })

  it('should strip every localized row id when there is no reference document', () => {
    const data = { items: [{ id: 'from-some-doc', label: 'one' }] }

    stripCrossLocaleRowIDs({ data, fields: localizedItemsFields })

    expect(data.items).toEqual([{ label: 'one' }])
  })

  it('should keep row ids of non-localized arrays', () => {
    const data = { rows: [{ id: 'shared-row', label: 'one' }] }

    stripCrossLocaleRowIDs({ data, existingDoc: { rows: [] }, fields: localizedItemsFields })

    expect(data.rows).toEqual([{ id: 'shared-row', label: 'one' }])
  })

  it('should strip row ids of arrays nested inside a localized group', () => {
    const fields: FlattenedField[] = [
      {
        name: 'hero',
        type: 'group',
        flattenedFields: [array('links', [text('label'), text('id')])],
        localized: true,
      } as FlattenedField,
    ]
    const data = { hero: { links: [{ id: 'from-other-locale', label: 'one' }] } }

    stripCrossLocaleRowIDs({ data, existingDoc: { hero: { links: [] } }, fields })

    expect(data.hero.links).toEqual([{ label: 'one' }])
  })

  it('should strip block row ids of a localized blocks field, matching nested fields by blockType', () => {
    const heroBlock = {
      slug: 'hero',
      flattenedFields: [array('ctas', [text('label'), text('id')])],
    } as unknown as FlattenedBlock
    const fields: FlattenedField[] = [
      {
        name: 'layout',
        type: 'blocks',
        blocks: ['hero'],
        localized: true,
      } as unknown as FlattenedField,
    ]
    const data = {
      layout: [
        {
          id: 'block-from-other-locale',
          blockType: 'hero',
          ctas: [{ id: 'cta-from-other-locale', label: 'one' }],
        },
      ],
    }

    stripCrossLocaleRowIDs({ blocks: [heroBlock], data, existingDoc: { layout: [] }, fields })

    expect(data.layout).toEqual([{ blockType: 'hero', ctas: [{ label: 'one' }] }])
  })

  it('should keep nested row ids when the parent row exists in the target locale', () => {
    const fields: FlattenedField[] = [
      array('items', [array('nested', [text('label'), text('id')]), text('id')], true),
    ]
    const data = {
      items: [{ id: 'row-1', nested: [{ id: 'nested-1', label: 'one' }] }],
    }

    stripCrossLocaleRowIDs({
      data,
      existingDoc: { items: [{ id: 'row-1', nested: [{ id: 'nested-1', label: 'old' }] }] },
      fields,
    })

    expect(data.items).toEqual([{ id: 'row-1', nested: [{ id: 'nested-1', label: 'one' }] }])
  })
})

describe('entityHasLocalizedRowContainers', () => {
  it('should detect a localized array', () => {
    expect(entityHasLocalizedRowContainers({ fields: localizedItemsFields })).toBe(true)
  })

  it('should return false when no array or blocks field stores per-locale rows', () => {
    const fields: FlattenedField[] = [
      text('title', true),
      array('rows', [text('label', true), text('id')]),
    ]

    expect(entityHasLocalizedRowContainers({ fields })).toBe(false)
  })

  it('should detect an array nested inside a localized group', () => {
    const fields: FlattenedField[] = [
      {
        name: 'hero',
        type: 'group',
        flattenedFields: [array('links', [text('label'), text('id')])],
        localized: true,
      } as FlattenedField,
    ]

    expect(entityHasLocalizedRowContainers({ fields })).toBe(true)
  })
})
