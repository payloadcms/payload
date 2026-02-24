import type { Payload } from 'payload'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../../../__helpers/shared/initPayloadInt.js'
import { blockFieldsSlug } from '../../slugs.js'

let payload: Payload

describe('Block images', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(__dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should include images config in block schema', () => {
    const config = payload.config
    const blockField = config.collections
      .find((c) => c.slug === blockFieldsSlug)
      ?.fields.find((f) => f.type === 'blocks' && f.name === 'blocks')

    expect(blockField).toBeDefined()
    expect(blockField.type).toBe('blocks')

    const withIconBlock = blockField.blocks.find((b) => b.slug === 'withIcon')

    expect(withIconBlock).toBeDefined()
    expect(withIconBlock.images).toBeDefined()
    expect(withIconBlock.images.icon).toEqual({
      url: '/api/uploads/file/payload20x20.png',
      alt: 'Block icon',
    })
    expect(withIconBlock.images.thumbnail).toEqual({
      url: '/api/uploads/file/payload480x320.jpg',
      alt: 'Block thumbnail',
    })
  })

  it('should allow blocks with images config', async () => {
    const result = await payload.create({
      collection: blockFieldsSlug,
      data: {
        blocks: [
          {
            blockType: 'withIcon',
            title: 'Test block with images',
          },
        ],
      },
    })

    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0].blockType).toBe('withIcon')
    expect(result.blocks[0].title).toBe('Test block with images')

    await payload.delete({
      collection: blockFieldsSlug,
      id: result.id,
    })
  })

  it('should support backwards compatibility - blocks without images', async () => {
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
