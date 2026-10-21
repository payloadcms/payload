import type { Field } from '../../../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { selectBranchQueryData } from './selectBranchQueryData.js'

const data = { id: 1, title: 'Root', sections: [{ id: 'row', label: 'Label', value: 3 }] }

describe('Raw branch select parity', () => {
  it('should preserve empty and ID-only inclusion semantics', () => {
    expect(selectBranchQueryData({ data, select: {} })).toEqual({ id: 1 })
    expect(selectBranchQueryData({ data, select: { id: true } })).toEqual({ id: 1 })
  })
  it('should apply nested exclusions without dropping unrelated fields or row IDs', () => {
    expect(selectBranchQueryData({ data, select: { sections: { label: false } } })).toEqual({
      id: 1,
      title: 'Root',
      sections: [{ id: 'row', value: 3 }],
    })
  })
  it('should apply nested array inclusions after preserving typed logical identities', () => {
    expect(selectBranchQueryData({ data, select: { sections: { label: true } } })).toEqual({
      id: 1,
      sections: [{ id: 'row', label: 'Label' }],
    })
  })
  it('should apply nested selection inside locale maps and preserve localization ancestry', () => {
    const fields: Field[] = [
      {
        name: 'details',
        type: 'group',
        localized: true,
        fields: [
          { name: 'title', type: 'text', localized: true },
          { name: 'secret', type: 'text' },
        ],
      },
    ]
    const data = {
      id: 1,
      root: 'kept',
      details: {
        en: { title: 'English', secret: 'hide' },
        fr: { title: 'French', secret: 'hide' },
      },
    }
    expect(selectBranchQueryData({ data, fields, select: { details: { title: true } } })).toEqual({
      id: 1,
      details: { en: { title: 'English' }, fr: { title: 'French' } },
    })
    expect(selectBranchQueryData({ data, fields, select: { details: { secret: false } } })).toEqual(
      { id: 1, root: 'kept', details: { en: { title: 'English' }, fr: { title: 'French' } } },
    )
  })
  it('should resolve block-slug selection and retain structural identity for unselected block types', () => {
    const fields: Field[] = [
      {
        name: 'layout',
        type: 'blocks',
        blocks: [
          {
            slug: 'hero',
            fields: [
              { name: 'title', type: 'text' },
              { name: 'secret', type: 'text' },
            ],
          },
          { slug: 'footer', fields: [{ name: 'label', type: 'text' }] },
        ],
      },
    ]
    const data = {
      id: 1,
      layout: [
        { id: 'h', blockType: 'hero', title: 'Title', secret: 'hide' },
        { id: 'f', blockType: 'footer', label: 'Footer' },
      ],
    }
    expect(
      selectBranchQueryData({ data, fields, select: { layout: { hero: { title: true } } } }),
    ).toEqual({
      id: 1,
      layout: [
        { id: 'h', blockType: 'hero', title: 'Title' },
        { id: 'f', blockType: 'footer' },
      ],
    })
    expect(
      selectBranchQueryData({ data, fields, select: { layout: { hero: { secret: false } } } }),
    ).toEqual({
      id: 1,
      layout: [
        { id: 'h', blockType: 'hero', title: 'Title' },
        { id: 'f', blockType: 'footer', label: 'Footer' },
      ],
    })
  })
})
