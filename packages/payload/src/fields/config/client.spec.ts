import type { Field } from './types.js'

import { describe, expect, it } from 'vitest'

import { createClientBlocks, createClientFields } from './client.js'

describe('client schema conversion cache', () => {
  it('should reuse shared definitions without exposing server properties or merging same-slug blocks', () => {
    const shared: Field = { name: 'text', type: 'text', access: { read: () => false } }
    const options = { defaultIDType: 'text' as const, i18n: {} as any, importMap: {} }
    const blocks = createClientBlocks({
      ...options,
      blocks: [
        { slug: 'example', fields: [shared, shared] },
        { slug: 'example', fields: [{ name: 'other', type: 'number' }] },
      ],
    })
    expect(typeof blocks[0]).toBe('object')
    const first = blocks[0] as Exclude<(typeof blocks)[number], string>
    const second = blocks[1] as Exclude<(typeof blocks)[number], string>
    expect(first.fields[0]).toBe(first.fields[1])
    expect(first.fields[0]).not.toHaveProperty('access')
    expect(first).not.toBe(second)
    expect(second.fields[0]).toHaveProperty('name', 'other')
  })

  it('should scope cached translations to a conversion call', () => {
    const field: Field = { name: 'text', type: 'text', label: ({ t }) => t('general:save') }
    const convert = (label: string) =>
      createClientFields({
        fields: [field, field],
        defaultIDType: 'text',
        importMap: {},
        i18n: { t: () => label } as any,
      })
    const english = convert('Save')
    const german = convert('Speichern')
    expect(english[0]).toBe(english[1])
    expect(english[0].label).toBe('Save')
    expect(german[0].label).toBe('Speichern')
    expect(english[0]).not.toBe(german[0])
  })
})
