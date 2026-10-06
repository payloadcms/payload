import type { ClientBlock, ClientField } from 'payload'

import { describe, expect, it } from 'vitest'

import { formatLocalizedFormData } from './formatLocalizedFormData.js'

describe('formatLocalizedFormData', () => {
  it('should wrap current locale values without changing shared values or the input', () => {
    const data = { title: 'English', shared: 'Shared', group: { title: 'Nested' } }
    const fields: ClientField[] = [
      { name: 'title', type: 'text', localized: true },
      { name: 'shared', type: 'text' },
      { name: 'group', type: 'group', fields: [{ name: 'title', type: 'text', localized: true }] },
    ]

    const result = formatLocalizedFormData({ data, fields, locale: 'en', mode: 'wrap' })

    expect(result).toEqual({
      title: { en: 'English' },
      shared: 'Shared',
      group: { title: { en: 'Nested' } },
    })
    expect(data).toEqual({ title: 'English', shared: 'Shared', group: { title: 'Nested' } })
  })

  it('should wrap an entire localized container once', () => {
    const fields: ClientField[] = [
      {
        name: 'group',
        type: 'group',
        localized: true,
        fields: [{ name: 'title', type: 'text', localized: true }],
      },
    ]

    const result = formatLocalizedFormData({
      data: { group: { title: 'Nested' } },
      fields,
      locale: 'en',
      mode: 'wrap',
    })

    expect(result).toEqual({ group: { en: { title: 'Nested' } } })
  })

  it('should unwrap the active locale in named tabs and referenced blocks', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [{ name: 'content', localized: true, fields: [{ name: 'title', type: 'text' }] }],
      },
      { name: 'blocks', type: 'blocks', blocks: [], blockReferences: ['text'] },
    ]
    const blocks: ClientBlock[] = [
      { slug: 'text', fields: [{ name: 'title', type: 'text', localized: true }] },
    ]

    const result = formatLocalizedFormData({
      blocks,
      data: {
        content: { en: { title: 'English' }, fr: { title: 'French' } },
        blocks: [{ blockType: 'text', title: { en: 'Block', fr: 'Bloc' } }],
      },
      fields,
      locale: 'en',
      mode: 'unwrap',
    })

    expect(result).toEqual({
      content: { title: 'English' },
      blocks: [{ blockType: 'text', title: 'Block' }],
    })
  })

  it('should wrap localized fields inside shared array rows while retaining row IDs', () => {
    const fields: ClientField[] = [
      {
        name: 'rows',
        type: 'array',
        fields: [{ name: 'title', type: 'text', localized: true }],
      },
    ]

    const result = formatLocalizedFormData({
      data: { rows: [{ id: 'row-id', title: null }] },
      fields,
      locale: 'en',
      mode: 'wrap',
    })

    expect(result).toEqual({ rows: [{ id: 'row-id', title: { en: null } }] })
  })
})
