import type mongoose from 'mongoose'
// @ts-ignore
import type { SanitizedCollectionConfig } from 'payload'

// @ts-ignore
import { type MongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig, buildVersionCollectionFields, getPayload } from 'payload'
import { expect, it } from 'vitest'

import { buildJoinAggregation } from '../../packages/db-mongodb/src/utilities/buildJoinAggregation.js'
import { buildProjectionFromSelect } from '../../packages/db-mongodb/src/utilities/buildProjectionFromSelect.js'
import { describe } from '../helpers/int/vitest.js'

describe(
  'buildJoinAggregation',
  { db: (adapter) => adapter === 'mongodb' || adapter === 'mongodb-atlas' },
  () => {
    const getAdapter = async (): Promise<MongooseAdapter> => {
      const payload = await getPayload({
        key: '_buildJoinAggregation',
        config: await buildConfig({
          secret: '______',
          db: await import('../databaseAdapter.js').then((mod) => mod.databaseAdapter),
          collections: [
            {
              slug: 'categories',
              fields: [
                {
                  name: 'posts',
                  type: 'join',
                  collection: 'posts',
                  on: 'category',
                },
                {
                  name: 'postsMany',
                  type: 'join',
                  collection: 'posts',
                  on: 'categories',
                },
              ],
            },
            {
              slug: 'versioned-categories',
              versions: { drafts: true },
              fields: [
                {
                  name: 'posts',
                  type: 'join',
                  // @ts-expect-error not generated
                  collection: 'versioned-posts',
                  on: 'category',
                },
                {
                  name: 'postsMany',
                  type: 'join',
                  // @ts-expect-error not generated
                  collection: 'versioned-posts',
                  on: 'categories',
                },
              ],
            },
            {
              slug: 'posts',
              fields: [
                {
                  name: 'category',
                  type: 'relationship',
                  relationTo: 'categories',
                },
                {
                  name: 'categories',
                  type: 'relationship',
                  relationTo: 'categories',
                  hasMany: true,
                },
              ],
            },
            {
              slug: 'versioned-posts',
              versions: { drafts: true },
              fields: [
                {
                  name: 'category',
                  type: 'relationship',
                  // @ts-expect-error not generated
                  relationTo: 'versioned-categories',
                },
                {
                  name: 'categories',
                  type: 'relationship',
                  // @ts-expect-error not generated
                  relationTo: 'versioned-categories',
                  hasMany: true,
                },
              ],
            },
          ],
        }),
      })

      return payload.db as unknown as MongooseAdapter
    }

    const getCollection = (adapter: MongooseAdapter): SanitizedCollectionConfig =>
      adapter.payload.collections.categories.config

    const getVersionedCollection = (adapter: MongooseAdapter): SanitizedCollectionConfig =>
      // @ts-expect-error not generated
      adapter.payload.collections['versioned-categories'].config

    const getLookups = (aggregation: mongoose.PipelineStage[]) =>
      aggregation.filter((each) => '$lookup' in each).map((each) => each.$lookup)

    it('should add all the joins to the aggregation', async () => {
      const adapter = await getAdapter()

      const aggregation = await buildJoinAggregation({
        adapter,
        collection: getCollection(adapter).slug,
        collectionConfig: getCollection(adapter),
      })

      expect(aggregation).toBeInstanceOf(Array)

      const lookups = getLookups(aggregation!)

      expect(lookups).toHaveLength(2)

      expect(lookups[0]!.as).toBe('posts.docs')
      expect(lookups[0]!.foreignField).toBe('category')
      expect(lookups[0]!.from).toBe('posts')
      expect(lookups[0]!.localField).toBe('_id')

      expect(lookups[1]!.as).toBe('postsMany.docs')
      expect(lookups[1]!.foreignField).toBe('categories')
      expect(lookups[1]!.from).toBe('posts')
      expect(lookups[1]!.localField).toBe('_id')
    })

    it('should add only 1 join because of the projection (include)', async () => {
      const adapter = await getAdapter()

      const aggregation = await buildJoinAggregation({
        adapter,
        collection: getCollection(adapter).slug,
        collectionConfig: getCollection(adapter),
        projection: buildProjectionFromSelect({
          adapter,
          fields: getCollection(adapter).flattenedFields,
          select: {
            posts: true,
          },
        }),
      })

      expect(aggregation).toBeInstanceOf(Array)

      const lookups = getLookups(aggregation!)
      expect(lookups).toHaveLength(1)

      expect(lookups[0]!.as).toBe('posts.docs')
      expect(lookups[0]!.foreignField).toBe('category')
      expect(lookups[0]!.from).toBe('posts')
      expect(lookups[0]!.localField).toBe('_id')
    })

    it('should add only 1 join because of the projection (exclude)', async () => {
      const adapter = await getAdapter()

      const aggregation = await buildJoinAggregation({
        adapter,
        collection: getCollection(adapter).slug,
        collectionConfig: getCollection(adapter),
        projection: buildProjectionFromSelect({
          adapter,
          fields: getCollection(adapter).flattenedFields,
          select: {
            posts: false,
          },
        }),
      })

      expect(aggregation).toBeInstanceOf(Array)

      const lookups = getLookups(aggregation!)
      expect(lookups).toHaveLength(1)

      expect(lookups[0]!.as).toBe('postsMany.docs')
      expect(lookups[0]!.foreignField).toBe('categories')
      expect(lookups[0]!.from).toBe('posts')
      expect(lookups[0]!.localField).toBe('_id')
    })

    it('should not add any joins because of the projection', async () => {
      const adapter = await getAdapter()

      const aggregation = await buildJoinAggregation({
        adapter,
        collection: getCollection(adapter).slug,
        collectionConfig: getCollection(adapter),
        projection: buildProjectionFromSelect({
          adapter,
          fields: getCollection(adapter).flattenedFields,
          select: {
            id: true,
          },
        }),
      })

      expect(aggregation).toBeInstanceOf(Array)
      expect(aggregation).toHaveLength(0)
    })

    it('should add all the joins to the aggregation with versions', async () => {
      const adapter = await getAdapter()

      const aggregation = await buildJoinAggregation({
        adapter,
        collection: getVersionedCollection(adapter).slug,
        collectionConfig: getVersionedCollection(adapter),
        versions: true,
        draftsEnabled: true,
      })

      expect(aggregation).toBeInstanceOf(Array)

      const lookups = getLookups(aggregation!)

      expect(lookups).toHaveLength(2)

      expect(lookups[0]!.as).toBe('version.posts.docs')
      expect(lookups[0]!.foreignField).toBe('version.category')
      expect(lookups[0]!.from).toBe('_versioned-posts_versions')
      expect(lookups[0]!.localField).toBe('parent')

      expect(lookups[1]!.as).toBe('version.postsMany.docs')
      expect(lookups[1]!.foreignField).toBe('version.categories')
      expect(lookups[1]!.from).toBe('_versioned-posts_versions')
      expect(lookups[1]!.localField).toBe('parent')
    })

    it('should add only 1 join because of the projection (include) with versions', async () => {
      const adapter = await getAdapter()
      const fields = buildVersionCollectionFields(
        adapter.payload.config,
        getVersionedCollection(adapter),
        true,
      )

      const projection = buildProjectionFromSelect({
        adapter,
        fields,
        select: {
          version: { posts: true },
        },
      })

      const aggregation = await buildJoinAggregation({
        adapter,
        collection: getVersionedCollection(adapter).slug,
        collectionConfig: getVersionedCollection(adapter),
        projection,
        versions: true,
        draftsEnabled: true,
      })

      expect(aggregation).toBeInstanceOf(Array)

      const lookups = getLookups(aggregation!)
      expect(lookups).toHaveLength(1)

      expect(lookups[0]!.as).toBe('version.posts.docs')
      expect(lookups[0]!.foreignField).toBe('version.category')
      expect(lookups[0]!.from).toBe('_versioned-posts_versions')
      expect(lookups[0]!.localField).toBe('parent')
    })

    it('should add only 1 join because of the projection (exclude) with versions', async () => {
      const adapter = await getAdapter()
      const fields = buildVersionCollectionFields(
        adapter.payload.config,
        getVersionedCollection(adapter),
        true,
      )

      const aggregation = await buildJoinAggregation({
        adapter,
        collection: getVersionedCollection(adapter).slug,
        collectionConfig: getVersionedCollection(adapter),
        projection: buildProjectionFromSelect({
          adapter,
          fields,
          select: {
            version: {
              posts: false,
            },
          },
        }),
        versions: true,
        draftsEnabled: true,
      })

      expect(aggregation).toBeInstanceOf(Array)

      const lookups = getLookups(aggregation!)
      expect(lookups).toHaveLength(1)

      expect(lookups[0]!.as).toBe('version.postsMany.docs')
      expect(lookups[0]!.foreignField).toBe('version.categories')
      expect(lookups[0]!.from).toBe('_versioned-posts_versions')
      expect(lookups[0]!.localField).toBe('parent')
    })

    it('should not add any joins because of the projection with versions', async () => {
      const adapter = await getAdapter()
      const fields = buildVersionCollectionFields(
        adapter.payload.config,
        getVersionedCollection(adapter),
        true,
      )

      const aggregation = await buildJoinAggregation({
        adapter,
        collection: getVersionedCollection(adapter).slug,
        collectionConfig: getVersionedCollection(adapter),
        projection: buildProjectionFromSelect({
          adapter,
          fields,
          select: {
            id: true,
          },
        }),
        versions: true,
        draftsEnabled: true,
      })

      expect(aggregation).toBeInstanceOf(Array)
      expect(aggregation).toHaveLength(0)
    })
  },
)
