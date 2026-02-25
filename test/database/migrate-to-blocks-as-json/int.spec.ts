import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { DrizzleAdapter } from '@payloadcms/drizzle'

import { rmSync } from 'fs'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { getPayload } from 'payload'
import { expect, it } from 'vitest'

import { describe } from '../../__helpers/int/vitest.js'
import config from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// path for temp config created after initial migration which should have blocks as json enabled
const tempConfigPath = path.resolve(dirname, 'GENERATED_after_migration.config.ts')

describe('migrateToBlocksAsJSON', { db: 'drizzle' }, () => {
  it('should migrate to blocks as json', async () => {
    // seed initital data
    const payload = await getPayload({ config })

    const adapter = payload.db as unknown as PostgresAdapter

    rmSync(adapter.findMigrationDir(), { force: true, recursive: true })
    rmSync(tempConfigPath, { force: true })

    // INITIAL MIGRATION

    process.env.PAYLOAD_CONFIG_PATH = path.resolve(dirname, 'config.ts')
    await adapter.createMigration({ payload })
    await adapter.migrate()

    // SEED
    const relatedItem = await payload.create({
      // @ts-expect-error not generated
      collection: 'relation',
      data: {
        name: 'Related Item 1',
      },
      depth: 0,
    })

    // Seed many documents to test batching (250 documents to ensure multiple batches with default size of 100)
    payload.logger.info('Seeding posts-batches collection with 250 documents...')
    const batchPosts: number[] = []
    for (let i = 0; i < 1000; i++) {
      const batchPost = await payload.create({
        // @ts-expect-error not generated
        collection: 'posts-batches',
        data: {
          title: `Batch Post ${i + 1}`,
          content: [
            {
              blockType: 'textBlock',
              text: `This is batch post content ${i + 1}`,
            },
          ],
        },
      })
      batchPosts.push(batchPost.id)
    }
    payload.logger.info('Finished seeding posts-batches collection')

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
            select: 'option1',
          },
        ],
      },
    })

    const versionedPost = await payload.create({
      collection: 'posts-versioned',
      data: {
        title: 'Versioned Post 1',
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

    // create another version of post
    await payload.update({
      collection: 'posts-versioned',
      id: versionedPost.id,
      data: {
        title: 'Versioned Post 1 - Updated',
        content: [
          {
            blockType: 'textBlock',
            text: 'This is a text block - updated',
            relation: relatedItem.id,
            manyRelations: [relatedItem.id],
          },
        ],
      },
    })

    // and more
    await payload.update({
      collection: 'posts-versioned',
      id: versionedPost.id,
      data: {
        title: 'Versioned Post 1 - Updated Again',
      },
    })

    await payload.updateGlobal({
      slug: 'global',
      data: {
        content: [
          {
            blockType: 'textBlock',
            text: 'Global text block',
          },
        ],
      },
    })

    await payload.updateGlobal({
      slug: 'global-versioned',
      data: {
        content: [
          {
            blockType: 'textBlock',
            text: 'Global versioned text block',
          },
        ],
      },
    })

    await payload.updateGlobal({
      slug: 'global-versioned',
      data: {
        content: [
          {
            blockType: 'textBlock',
            text: 'Global versioned text block - updated',
          },
        ],
      },
    })

    const currentConfig = readFileSync(path.resolve(dirname, 'config.ts'), 'utf-8')
    writeFileSync(tempConfigPath, currentConfig, 'utf-8')

    process.env.PAYLOAD_CONFIG_PATH = tempConfigPath

    await adapter.createMigration({
      payload,
      file: '@payloadcms/db-postgres/blocks-as-json',
    })

    process.env.PAYLOAD_DROP_DATABASE = 'false'

    // verify config was updated
    {
      const { default: tempConfig } = await import('./GENERATED_after_migration.config.js')
      const tempPayload = await getPayload({ config: tempConfig, key: '_temp' })
      const tempDb = tempPayload.db as unknown as DrizzleAdapter
      expect(tempDb.blocksAsJSON).toBe(true)
      await tempPayload.destroy()
    }

    await payload.destroy()

    const migratedPayload = await getPayload({
      config: await import(tempConfigPath).then((mod) => mod.default),
      key: '_migrated',
    })

    await migratedPayload.db.migrate()

    // verify data was migrated
    const updatedPost = await migratedPayload.findByID({
      collection: 'posts',
      id: post.id,
      depth: 0,
    })

    expect(updatedPost.content).toEqual([
      {
        id: expect.any(String),
        blockName: null,
        blockType: 'textBlock',
        text: 'This is a text block',
        relation: relatedItem.id,
        manyRelations: [relatedItem.id],
        select: 'option1',
      },
    ])

    const updatedVersionedPost = await migratedPayload.findByID({
      collection: 'posts-versioned',
      id: versionedPost.id,
      depth: 0,
    })

    // Verify all batch posts were migrated
    const { totalDocs: batchPostsTotal } = await migratedPayload.find({
      // @ts-expect-error not generated
      collection: 'posts-batches',
      limit: 0,
    })
    expect(batchPostsTotal).toBe(1000)

    // Verify a sample batch post
    const sampleBatchPost = await migratedPayload.findByID({
      // @ts-expect-error not generated
      collection: 'posts-batches',
      id: batchPosts[500], // Check middle post
      depth: 0,
    })
    expect(sampleBatchPost.title).toBe('Batch Post 501')
    expect(sampleBatchPost.content).toEqual([
      {
        id: expect.any(String),
        blockName: null,
        blockType: 'textBlock',
        text: 'This is batch post content 501',
      },
    ])

    expect(updatedVersionedPost.content).toEqual([
      {
        id: expect.any(String),
        blockName: null,
        blockType: 'textBlock',
        text: 'This is a text block - updated',
        relation: relatedItem.id,
        manyRelations: [relatedItem.id],
      },
    ])

    const updatedVersions = await migratedPayload.findVersions({
      collection: 'posts-versioned',
      limit: 0,
      sort: 'createdAt',
      depth: 0,
    })

    expect(updatedVersions.totalDocs).toBe(3)

    expect(updatedVersions.docs[0]?.version.content).toEqual([
      {
        id: expect.any(String),
        blockName: null,
        blockType: 'textBlock',
        text: 'This is a text block',
        relation: relatedItem.id,
        manyRelations: [relatedItem.id],
      },
    ])

    expect(updatedVersions.docs[1]?.version.content).toEqual([
      {
        id: expect.any(String),
        blockName: null,
        blockType: 'textBlock',
        text: 'This is a text block - updated',
        relation: relatedItem.id,
        manyRelations: [relatedItem.id],
      },
    ])

    const updatedGlobal = await migratedPayload.findGlobal({
      slug: 'global',
      depth: 0,
    })

    expect(updatedGlobal.content).toEqual([
      {
        id: expect.any(String),
        blockName: null,
        blockType: 'textBlock',
        text: 'Global text block',
      },
    ])

    const updatedVersionedGlobal = await migratedPayload.findGlobal({
      slug: 'global-versioned',
      depth: 0,
    })

    expect(updatedVersionedGlobal.content).toEqual([
      {
        id: expect.any(String),
        blockName: null,
        blockType: 'textBlock',
        text: 'Global versioned text block - updated',
      },
    ])

    const updatedGlobalVersions = await migratedPayload.findGlobalVersions({
      slug: 'global-versioned',
      limit: 0,
      sort: 'createdAt',
      depth: 0,
    })

    expect(updatedGlobalVersions.totalDocs).toBe(2)

    expect(updatedGlobalVersions.docs[0]?.version.content).toEqual([
      {
        id: expect.any(String),
        blockName: null,
        blockType: 'textBlock',
        text: 'Global versioned text block',
      },
    ])

    await migratedPayload.destroy()
  })
})
