import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { MongooseAdapter } from '../../packages/db-mongodb/src/index.js'

import { buildProjectionQuery } from '../../packages/db-mongodb/src/branching/buildProjectionQuery.js'

describe.skipIf(process.env.BRANCH_READ_SNAPSHOT_NATIVE !== 'true')(
  'default Mongo ObjectId effective relationship routing',
  () => {
    let connection: mongoose.Connection
    let adapter: MongooseAdapter
    const id = new mongoose.Types.ObjectId()
    const tagID = new mongoose.Types.ObjectId()
    const textID = 'abcdefabcdefabcdefabcdef'
    const projectionID = 'private-cache-row'
    const metadata = [
      { name: 'logicalID', type: 'text' },
      { name: 'branchKey', type: 'text' },
      { name: 'isVisible', type: 'checkbox' },
    ]
    const polyJoin = { name: 'polyBacklinks', type: 'join', collection: 'tags', on: 'polyOwners' }
    const join = { name: 'backlinks', type: 'join', collection: 'tags', on: 'owner' }
    const documentFields = [
      { name: 'title', type: 'text' },
      { name: 'tag', type: 'relationship', relationTo: 'tags' },
      join,
      polyJoin,
    ]
    const tagFields = [
      { name: 'title', type: 'text' },
      { name: 'owner', type: 'relationship', relationTo: 'documents' },
      { name: 'manyOwners', type: 'relationship', relationTo: 'documents', hasMany: true },
      { name: 'textOwner', type: 'relationship', relationTo: 'texts' },
      {
        name: 'polyOwners',
        type: 'relationship',
        relationTo: ['documents', 'tags', 'texts'],
        hasMany: true,
      },
    ]
    const context = {
      branchKey: 'staging',
      relationAccess: { cache: {}, tags: {}, documents: {}, texts: {}, textcache: {} },
    }

    beforeAll(async () => {
      connection = await mongoose
        .createConnection(process.env.MONGODB_URL!, {
          dbName: `objectid_branch_${randomUUID().replaceAll('-', '')}`,
        })
        .asPromise()
      const documents = connection.model(
        'documents',
        new mongoose.Schema({ title: String }),
        'documents',
      )
      const tags = connection.model(
        'tags',
        new mongoose.Schema({
          title: String,
          owner: mongoose.Schema.Types.ObjectId,
          manyOwners: [mongoose.Schema.Types.ObjectId],
          textOwner: String,
          polyOwners: [mongoose.Schema.Types.Mixed],
        }),
        'tags',
      )
      const cache = connection.model(
        'cache',
        new mongoose.Schema({
          _id: String,
          title: String,
          tag: mongoose.Schema.Types.ObjectId,
          _branchProjection: { logicalID: String, branchKey: String, isVisible: Boolean },
        }),
        'cache',
      )
      const texts = connection.model(
        'texts',
        new mongoose.Schema({ _id: String, title: String }),
        'texts',
      )
      const textcache = connection.model(
        'textcache',
        new mongoose.Schema({
          _id: String,
          title: String,
          _branchProjection: { logicalID: String, branchKey: String, isVisible: Boolean },
        }),
        'textcache',
      )
      const config = (slug: string, fields: unknown[], custom = {}) => ({
        slug,
        fields,
        flattenedFields: fields,
        custom,
        joins: {},
        polymorphicJoins: [],
        timestamps: false,
      })
      const cacheConfig = config(
        'cache',
        [
          ...documentFields,
          { name: '_branchProjection', type: 'group', fields: metadata, flattenedFields: metadata },
        ],
        { branchProjectionStorage: { collection: 'documents' } },
      )
      cacheConfig.joins = {
        tags: [
          { joinPath: 'backlinks', field: join },
          { joinPath: 'polyBacklinks', field: polyJoin },
        ],
      }
      adapter = {
        collections: { documents, tags, cache, texts, textcache },
        sessions: {},
        payload: {
          db: { defaultIDType: 'text' },
          config: { localization: false },
          collections: {
            texts: {
              customIDType: 'text',
              config: config(
                'texts',
                [
                  { name: 'id', type: 'text' },
                  { name: 'title', type: 'text' },
                ],
                { branchQueryStorage: { projection: 'textcache' } },
              ),
            },
            textcache: {
              customIDType: 'text',
              config: config(
                'textcache',
                [
                  { name: 'title', type: 'text' },
                  {
                    name: '_branchProjection',
                    type: 'group',
                    fields: metadata,
                    flattenedFields: metadata,
                  },
                ],
                { branchProjectionStorage: { collection: 'texts' } },
              ),
            },
            documents: {
              config: config('documents', documentFields, {
                branchQueryStorage: { projection: 'cache' },
              }),
            },
            tags: { config: config('tags', tagFields) },
            cache: { customIDType: 'text', config: cacheConfig },
          },
        },
      } as unknown as MongooseAdapter
      await documents.create({ _id: id, title: 'Published' })
      await tags.create({
        _id: tagID,
        title: 'Tag',
        owner: id,
        manyOwners: [id],
        textOwner: textID,
        polyOwners: [
          { relationTo: 'documents', value: id },
          { relationTo: 'texts', value: textID },
        ],
      })
      await texts.create({ _id: textID, title: 'Published text' })
      await textcache.create({
        _id: 'private-text-cache',
        title: 'Effective text',
        _branchProjection: { logicalID: textID, branchKey: 'staging', isVisible: true },
      })
      await cache.create({
        _id: projectionID,
        title: 'Effective',
        tag: tagID,
        _branchProjection: { logicalID: id.toHexString(), branchKey: 'staging', isVisible: true },
      })
    })
    afterAll(async () => {
      await connection?.dropDatabase()
      await connection?.close()
    })

    it('should compare native ordinary ObjectId references to typed logical effective IDs in forward and polymorphic policies', async () => {
      for (const where of [
        { 'owner.title': { equals: 'Effective' } },
        { 'manyOwners.title': { equals: 'Effective' } },
        { 'textOwner.title': { equals: 'Effective text' } },
        { textOwner: { equals: textID } },
        { 'polyOwners.value': { equals: textID } },
        { owner: { equals: id.toHexString() } },
        { 'polyOwners.value': { equals: id.toHexString() } },
      ]) {
        const query = await buildProjectionQuery({ adapter, collection: 'tags', context, where })
        const rows = await adapter.collections.tags.aggregate(query.stages as never)
        expect(rows.map(({ _id }) => String(_id))).toEqual([tagID.toHexString()])
      }
      const query = await buildProjectionQuery({
        adapter,
        collection: 'cache',
        context: {
          ...context,
          relationAccess: {
            ...context.relationAccess,
            tags: { 'owner.title': { equals: 'Effective' } },
          },
        },
        where: { 'tag.title': { equals: 'Tag' } },
      })
      expect(
        (
          await adapter.collections[query.sourceCollection ?? 'cache'].aggregate(
            query.stages as never,
          )
        ).map(({ _id }) => _id),
      ).toEqual([projectionID])
    })

    it('should exclude hidden or policy-denied targets for ordinary default and custom ID references', async () => {
      for (const [field, value, target] of [
        ['owner', id.toHexString(), 'cache'],
        ['textOwner', textID, 'textcache'],
      ] as const) {
        const denied = await buildProjectionQuery({
          adapter,
          collection: 'tags',
          context: { ...context, relationAccess: { ...context.relationAccess, [target]: false } },
          where: { [field]: { equals: value } },
        })
        expect(await adapter.collections.tags.aggregate(denied.stages as never)).toEqual([])
        await adapter.collections[target].updateOne(
          {},
          { $set: { '_branchProjection.isVisible': false } },
        )
        try {
          const hidden = await buildProjectionQuery({
            adapter,
            collection: 'tags',
            context,
            where: { [field]: { equals: value } },
          })
          expect(await adapter.collections.tags.aggregate(hidden.stages as never)).toEqual([])
        } finally {
          await adapter.collections[target].updateOne(
            {},
            { $set: { '_branchProjection.isVisible': true } },
          )
        }
      }
    })

    it('should join a cache root to an ordinary reverse relationship through its native ObjectId rather than its private row key', async () => {
      const query = await buildProjectionQuery({ adapter, collection: 'cache', context })
      const joins = await query.buildJoins({
        joins: {
          backlinks: { count: true, sort: 'id' },
          polyBacklinks: { count: true, sort: 'id' },
        },
      })
      const rows = await adapter.collections.cache.aggregate([...query.stages, ...joins] as never)
      expect(rows[0].backlinks.docs.map(String)).toEqual([tagID.toHexString()])
      expect(rows[0].backlinks.totalDocs).toBe(1)
      expect(rows[0].polyBacklinks.docs.map(String)).toEqual([tagID.toHexString()])
      expect(rows[0].polyBacklinks.totalDocs).toBe(1)
    })
  },
)
