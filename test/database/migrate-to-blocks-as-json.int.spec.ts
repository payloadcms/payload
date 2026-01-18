import type { PostgresAdapter } from '@payloadcms/db-postgres'

import { getPayload } from 'payload'
import { expect, it } from 'vitest'

import { describe } from '../helpers/vitest.js'
import config from './migrate-to-blocks-as-json.config.js'

describe('migrateToBlocksAsJSON', { db: (name) => name === 'postgres' }, () => {
  it('should migrate to blocks as json', async () => {
    const payload = await getPayload({ config })
    const adapter = payload.db as unknown as PostgresAdapter

    const relatedItem = await payload.create({
      // @ts-expect-error not generated
      collection: 'relation',
      data: {
        name: 'Related Item 1',
      },
    })

    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Post 1',
        // @ts-expect-error not generated
        content: [
          {
            blockType: 'textBlock',
            text: 'This is a text block',
            relation: relatedItem.id,
            manyRelations: [relatedItem.id],
          },
        ],
      },
    })

    await adapter.migrateToBlocksAsJSON()

    const migratedPost = await payload.findByID({
      collection: 'posts',
      id: post.id,
      depth: 0,
    })

    // @ts-expect-error not generated
    expect(migratedPost?.content).toEqual([
      {
        blockName: null,
        id: expect.any(String),
        blockType: 'textBlock',
        text: 'This is a text block',
        relation: relatedItem.id,
        manyRelations: [relatedItem.id],
      },
    ])

    expect(true).toBeTruthy()
  })
})
