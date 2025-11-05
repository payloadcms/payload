import { Block, Payload, sanitizeConfig } from 'payload'
import { findSharedBlocks } from './findSharedBlocks'
const block_1: Block = {
  slug: 'test-block',
  fields: [],
}

const block_2: Block = {
  slug: 'test-block-non-shared',
  fields: [],
}

const getPayload = async () => {
  return {
    config: await sanitizeConfig({
      collections: [
        {
          slug: 'collection-1',
          fields: [
            {
              type: 'blocks',
              name: 'blocks',
              blocks: [block_1],
            },
          ],
        },
        {
          slug: 'collection-2',
          fields: [
            {
              type: 'group',
              name: 'group',
              fields: [
                {
                  type: 'blocks',
                  name: 'blocks',
                  blocks: [block_1, block_2],
                },
              ],
            },
          ],
        },
      ],
    } as any),
  } as Payload
}

describe('findSharedBlocks', () => {
  it('should find block_1 as shared', async () => {
    const payload = await getPayload()
    const map = findSharedBlocks(payload)
    expect(map.size).toBe(1)
    expect(map.has(block_1)).toBe(true)
  })

  it('should not find block_2 as shared', async () => {
    const payload = await getPayload()
    const map = findSharedBlocks(payload)
    expect(map.size).toBe(1)
    expect(map.has(block_2)).toBe(false)
  })
})
