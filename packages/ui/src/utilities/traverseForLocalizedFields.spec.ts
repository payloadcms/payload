import type { ClientBlock, ClientField } from 'payload'

import { describe, expect, it } from 'vitest'

import { traverseForLocalizedFields } from './traverseForLocalizedFields.js'

describe('traverseForLocalizedFields', () => {
  it('should find localized fields in referenced blocks', () => {
    const blocksMap: Record<string, ClientBlock> = {
      hero: {
        fields: [{ localized: true, name: 'heading', type: 'text' }],
        slug: 'hero',
      },
    }
    const fields: ClientField[] = [
      {
        blocks: ['hero'],
        name: 'layout',
        type: 'blocks',
      },
    ]

    expect(
      traverseForLocalizedFields({
        blocksMap,
        fields,
      }),
    ).toBe(true)
  })
})
