import { expect, it, describe, beforeAll, afterAll } from 'vitest'

import type { Payload } from 'payload'

import { initPayloadInt } from '../../../__helpers/shared/initPayloadInt.js'
import { blockFieldsSlug } from '../../slugs.js'

let payload: Payload

describe('Block iconImageURL', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(__dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should include iconImageURL and iconImageAltText in block schema', async () => {
    const config = payload.config
    const blockField = config.collections
      .find((c) => c.slug === blockFieldsSlug)
      ?.fields.find((f) => f.type === 'blocks' && f.name === 'blocks')

    expect(blockField).toBeDefined()
    expect(blockField.type).toBe('blocks')

    const withIconBlock = blockField.blocks.find((b) => b.slug === 'withIcon')

    expect(withIconBlock).toBeDefined()
    expect(withIconBlock.iconImageURL).toBe('/api/uploads/file/payload20x20.png')
    expect(withIconBlock.iconImageAltText).toBe('Block icon')
    expect(withIconBlock.imageURL).toBe('/api/uploads/file/payload480x320.jpg')
    expect(withIconBlock.imageAltText).toBe('Block thumbnail')
  })

  it('should allow blocks with only iconImageURL', async () => {
    const result = await payload.create({
      collection: blockFieldsSlug,
      data: {
        blocks: [
          {
            blockType: 'withIcon',
            title: 'Test block with icon',
          },
        ],
      },
    })

    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0].blockType).toBe('withIcon')
    expect(result.blocks[0].title).toBe('Test block with icon')

    await payload.delete({
      collection: blockFieldsSlug,
      id: result.id,
    })
  })

  it('should support backwards compatibility - blocks without iconImageURL', async () => {
    const result = await payload.create({
      collection: blockFieldsSlug,
      data: {
        blocks: [
          {
            blockType: 'content',
            text: 'Test content',
          },
        ],
      },
    })

    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0].blockType).toBe('content')
    expect(result.blocks[0].text).toBe('Test content')

    await payload.delete({
      collection: blockFieldsSlug,
      id: result.id,
    })
  })
})
