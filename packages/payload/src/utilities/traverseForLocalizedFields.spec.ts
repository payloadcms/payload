import type { Block, Field } from '../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { traverseForLocalizedFields } from './traverseForLocalizedFields.js'

const localizedBlock: Block = {
  slug: 'localized-block',
  fields: [{ name: 'title', type: 'text', localized: true }],
}

const plainBlock: Block = {
  slug: 'plain-block',
  fields: [{ name: 'title', type: 'text' }],
}

describe('traverseForLocalizedFields', () => {
  it('should return false when nothing is localized', () => {
    const fields: Field[] = [{ name: 'title', type: 'text' }]

    expect(traverseForLocalizedFields({ fields })).toBe(false)
  })

  it('should detect a localized field at the top level', () => {
    const fields: Field[] = [{ name: 'title', type: 'text', localized: true }]

    expect(traverseForLocalizedFields({ fields })).toBe(true)
  })

  it('should detect a localized field inside an inline block', () => {
    const fields: Field[] = [{ name: 'layout', type: 'blocks', blocks: [localizedBlock] }]

    expect(traverseForLocalizedFields({ fields })).toBe(true)
  })

  it('should detect a localized field inside a referenced block', () => {
    const fields: Field[] = [{ name: 'layout', type: 'blocks', blocks: ['localized-block'] }]

    expect(traverseForLocalizedFields({ blocks: [localizedBlock], fields })).toBe(true)
  })

  it('should return false for a referenced block with no localized fields', () => {
    const fields: Field[] = [{ name: 'layout', type: 'blocks', blocks: ['plain-block'] }]

    expect(traverseForLocalizedFields({ blocks: [plainBlock], fields })).toBe(false)
  })

  it('should return false for a referenced block that cannot be resolved', () => {
    const fields: Field[] = [{ name: 'layout', type: 'blocks', blocks: ['localized-block'] }]

    expect(traverseForLocalizedFields({ blocks: [], fields })).toBe(false)
  })

  it('should detect a localized field in a block referenced from a nested array', () => {
    const fields: Field[] = [
      {
        name: 'rows',
        type: 'array',
        fields: [{ name: 'layout', type: 'blocks', blocks: ['localized-block'] }],
      },
    ]

    expect(traverseForLocalizedFields({ blocks: [localizedBlock], fields })).toBe(true)
  })
})
