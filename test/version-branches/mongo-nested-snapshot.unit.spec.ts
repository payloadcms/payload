// Exercise native query helpers without initializing Payload or mutating the shared integration adapter.
import type { PayloadRequest, Where } from 'payload'

import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import {
  BasePayload,
  buildConfig,
  buildVersionCollectionFields,
  buildVersionGlobalFields,
} from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { MongooseAdapter } from '../../packages/db-mongodb/src/index.js'

import { createReadSnapshot } from '../../packages/db-mongodb/src/branching/createReadSnapshot.js'
import { count } from '../../packages/db-mongodb/src/count.js'
import { countGlobalVersions } from '../../packages/db-mongodb/src/countGlobalVersions.js'
import { countVersions } from '../../packages/db-mongodb/src/countVersions.js'
import { find } from '../../packages/db-mongodb/src/find.js'
import { findDistinct } from '../../packages/db-mongodb/src/findDistinct.js'
import { findGlobalVersions } from '../../packages/db-mongodb/src/findGlobalVersions.js'
import { findOne } from '../../packages/db-mongodb/src/findOne.js'
import { findVersions } from '../../packages/db-mongodb/src/findVersions.js'
import { buildCollectionSchema } from '../../packages/db-mongodb/src/models/buildCollectionSchema.js'
import { buildSchema } from '../../packages/db-mongodb/src/models/buildSchema.js'
import { createMongoSchemaBuildContext } from '../../packages/db-mongodb/src/models/schemaBuildContext.js'
import { queryDrafts } from '../../packages/db-mongodb/src/queryDrafts.js'

const paginate = createRequire(new URL('../../packages/db-mongodb/package.json', import.meta.url))(
  'mongoose-paginate-v2',
)

const isNativeEnabled = process.env.BRANCH_MONGO_NESTED_SNAPSHOT_NATIVE === 'true'

describe.skipIf(!isNativeEnabled)('native nested MongoDB snapshot queries', () => {
  let connection: mongoose.Connection
  let adapter: MongooseAdapter
  let payload: BasePayload
  const targetHook = vi.fn(({ doc }) => doc)
  const parentHook = vi.fn(({ doc }) => doc)
  const targetID = new mongoose.Types.ObjectId()
  const parentID = new mongoose.Types.ObjectId()
  const childID = new mongoose.Types.ObjectId()
  const addedChildID = new mongoose.Types.ObjectId()
  const request = () =>
    Object.assign(new Request('https://payload.test/api/parents'), {
      context: {},
      payload,
    }) as unknown as PayloadRequest

  beforeAll(async () => {
    connection = await mongoose
      .createConnection(process.env.MONGODB_URL!, {
        dbName: `branch_nested_${randomUUID().replaceAll('-', '')}`,
        monitorCommands: true,
      })
      .asPromise()
    payload = new BasePayload()
    payload.config = await buildConfig({
      secret: 'native-nested-snapshot-test',
      globals: [
        {
          slug: 'settings',
          versions: { drafts: true },
          fields: [{ name: 'position', type: 'point' }],
        },
      ],
      collections: [
        {
          slug: 'targets',
          access: { read: () => true },
          timestamps: false,
          versions: false,
          hooks: { afterRead: [targetHook] },
          fields: [
            { name: 'title', type: 'text' },
            { name: 'position', type: 'point' },
          ],
        },
        {
          slug: 'parents',
          access: { read: () => true },
          timestamps: true,
          versions: { drafts: true },
          hooks: { afterRead: [parentHook] },
          fields: [
            { name: 'title', type: 'text' },
            { name: 'position', type: 'point' },
            { name: 'target', type: 'relationship', relationTo: 'targets' },
            { name: 'targets', type: 'relationship', relationTo: 'targets', hasMany: true },
            { name: 'children', type: 'join', collection: 'children', on: 'parent' },
            { name: 'otherChildren', type: 'join', collection: 'children', on: 'parent' },
          ],
        },
        {
          slug: 'children',
          access: { read: () => true },
          timestamps: false,
          versions: false,
          fields: [
            { name: 'title', type: 'text' },
            { name: 'parent', type: 'relationship', relationTo: 'parents' },
            { name: 'target', type: 'relationship', relationTo: 'targets' },
          ],
        },
      ],
      typescript: { autoGenerate: false },
    })
    payload.collections = Object.fromEntries(
      payload.config.collections.map((config) => [config.slug, { config }]),
    ) as never
    const context = createMongoSchemaBuildContext({ connection })
    const models = Object.fromEntries(
      payload.config.collections.map((collection) => [
        collection.slug,
        connection.model(
          collection.slug,
          buildCollectionSchema({ collection, payload, schemaBuildContext: context }),
          collection.slug,
        ),
      ]),
    )
    adapter = {
      collections: models,
      connection,
      count,
      find,
      findDistinct,
      findOne,
      defaultIDType: 'text',
      name: 'mongoose',
      payload,
      sessions: {},
      versions: {},
      countVersions,
      countGlobalVersions,
      findVersions,
      findGlobalVersions,
      queryDrafts,
    } as unknown as MongooseAdapter
    for (const [slug, fields] of [
      [
        'parents',
        buildVersionCollectionFields(payload.config, payload.collections.parents!.config, true),
      ],
      ['settings', buildVersionGlobalFields(payload.config, payload.config.globals[0]!, true)],
    ] as const) {
      const schema = buildSchema({
        configFields: fields,
        buildSchemaOptions: { options: { timestamps: true } },
        payload,
        schemaBuildContext: context,
        schemaPath: `versions:${slug}`,
      })
      schema.plugin(paginate)
      adapter.versions[slug] = connection.model(
        `versions_${slug}`,
        schema,
        `versions_${slug}`,
      ) as never
    }
    adapter.branching = {
      withReadSnapshot: createReadSnapshot({ adapter, isTransactionsEnabled: true }),
    } as never
    payload.db = adapter as never
    payload.collections.targets!.config.custom = { branchQueryStorage: { states: 'targets' } }
    await Promise.all(
      [...Object.values(models), ...Object.values(adapter.versions)].map((model) => model.init()),
    )
  }, 60_000)

  beforeEach(async () => {
    targetHook.mockClear()
    parentHook.mockClear()
    adapter.useJoinAggregations = false
    await connection.db!.collection('versions_parents').deleteMany({})
    await connection.db!.collection('versions_settings').deleteMany({})
    await connection.db!.collection('targets').deleteMany({})
    await connection.db!.collection('parents').deleteMany({})
    await connection.db!.collection('children').deleteMany({})
    await connection
      .db!.collection('targets')
      .insertOne({ _id: targetID, title: 'old', position: { type: 'Point', coordinates: [0, 0] } })
    await connection.db!.collection('parents').insertOne({
      _id: parentID,
      title: 'parent',
      position: { type: 'Point', coordinates: [0, 0] },
      target: targetID,
      targets: [targetID],
    })
    await connection
      .db!.collection('children')
      .insertOne({ _id: childID, title: 'old', parent: parentID, target: targetID })
  })

  afterAll(async () => {
    if (connection) {
      await connection.dropDatabase()
      await connection.close()
    }
  })

  const changeAfterPin = async () => {
    await connection
      .db!.collection('targets')
      .updateOne({ _id: targetID }, { $set: { title: 'new' } })
    await connection
      .db!.collection('children')
      .updateOne({ _id: childID }, { $set: { title: 'new' } })
    await connection
      .db!.collection('children')
      .insertOne({ _id: addedChildID, title: 'old', parent: parentID, target: targetID })
  }

  for (const isAggregated of [false, true]) {
    it(`should pin relationship filters and reverse joins with ${isAggregated ? 'aggregate' : 'separate'} joins`, async () => {
      adapter.useJoinAggregations = isAggregated
      const shapes = await adapter.branching!.withReadSnapshot!({
        req: request(),
        read: async ({ req }) => {
          await changeAfterPin()
          const query = async (where: Record<string, unknown>) =>
            payload.find({
              collection: 'parents',
              depth: 0,
              limit: 1,
              overrideAccess: false,
              req,
              where,
              joins: {
                children: { count: true, limit: 5 },
                otherChildren: { count: true, limit: 5 },
              },
            })
          const dot = await query({ and: [{ 'target.title': { equals: 'old' } }] })
          expect(dot.docs.map((doc) => doc.id)).toEqual([parentID.toHexString()])
          expect(dot.docs[0].children.docs).toEqual([childID.toHexString()])
          const hasMany = await query({ targets: { contains: { title: { equals: 'old' } } } })
          const reverse = await query({ 'children.title': { equals: 'old' } })
          const multiHop = await query({ 'children.target.title': { equals: 'old' } })
          const filteredJoin = await payload.find({
            collection: 'parents',
            depth: 0,
            limit: 1,
            overrideAccess: false,
            req,
            where: { id: { equals: parentID.toHexString() } },
            joins: { children: { count: true, where: { 'target.title': { equals: 'old' } } } },
          })
          const counted = await req.payload.db.count({ collection: 'targets', req })
          const distinct = await req.payload.db.findDistinct({
            collection: 'parents',
            field: 'title',
            limit: 1,
            req,
            where: { 'target.title': { equals: 'old' } },
          })
          return { dot, hasMany, reverse, multiHop, filteredJoin, counted, distinct }
        },
      })
      for (const result of [
        shapes.dot,
        shapes.hasMany,
        shapes.reverse,
        shapes.multiHop,
        shapes.filteredJoin,
      ]) {
        expect(result.totalDocs).toBe(1)
        expect(result.docs.map((doc) => doc.id)).toEqual([parentID.toHexString()])
        expect(result.docs[0].children.docs).toEqual([childID.toHexString()])
        expect(result.docs[0].children.totalDocs).toBe(1)
      }
      expect(shapes.counted.totalDocs).toBe(1)
      expect(shapes.distinct.values).toEqual([{ title: 'parent' }])
      expect(parentHook).toHaveBeenCalledTimes(5)
      expect(
        (await payload.find({ collection: 'targets', depth: 0, overrideAccess: false })).docs[0]
          .title,
      ).toBe('new')
    })
  }

  it('should run an explicit nested Local API read hook once against the pinned native session', async () => {
    const config = payload.collections.parents!.config
    const previous = config.access.read
    const access = vi.fn(async ({ req }: { req: PayloadRequest }) => {
      const result = await payload.find({
        collection: 'targets',
        depth: 0,
        overrideAccess: false,
        req,
      })
      expect(result.docs[0].title).toBe('old')
      return true
    })
    config.access.read = access
    try {
      await adapter.branching!.withReadSnapshot!({
        req: request(),
        read: async ({ req }) => {
          await changeAfterPin()
          return payload.find({
            collection: 'parents',
            depth: 0,
            overrideAccess: false,
            req,
            where: { id: { equals: parentID.toHexString() } },
          })
        },
      })
      expect(access).toHaveBeenCalledTimes(1)
      expect(targetHook).toHaveBeenCalledTimes(1)
      expect(parentHook).toHaveBeenCalledTimes(1)
    } finally {
      config.access.read = previous
    }
  })

  it('should count and page native near queries in the same snapshot for both join engines', async () => {
    await connection
      .db!.collection('parents')
      .insertOne({ title: 'far', position: { type: 'Point', coordinates: [10, 10] } })
    const previousAllowAdditionalKeys = adapter.allowAdditionalKeys
    adapter.allowAdditionalKeys = true
    await connection.db!.collection('parents').updateOne(
      { _id: parentID },
      {
        $set: {
          __payloadBranchNativeDistance: 'preserved',
          extraRows: [{ __payloadBranchNativeDistance: 'nested-preserved' }],
        },
      },
    )
    try {
      for (const useJoinAggregations of [false, true]) {
        adapter.useJoinAggregations = useJoinAggregations
        await adapter.branching!.withReadSnapshot!({
          req: request(),
          read: async ({ req }) => {
            const where = { position: { near: [0, 0, 1000] } }
            const result = await req.payload.find({
              collection: 'parents',
              where,
              limit: 1,
              depth: 0,
              overrideAccess: false,
            })
            expect(result.docs.map(({ id }) => id)).toEqual([parentID.toHexString()])
            expect(result.totalDocs).toBe(1)
            expect(result.docs[0].__payloadBranchNativeDistance).toBe('preserved')
            expect(result.docs[0].extraRows).toEqual([
              { __payloadBranchNativeDistance: 'nested-preserved' },
            ])
            expect(
              Object.keys(result.docs[0]).filter((key) =>
                key.startsWith('__payloadBranchNativeDistance_'),
              ),
            ).toEqual([])
            expect(await req.payload.db.count({ collection: 'parents', req, where })).toEqual({
              totalDocs: 1,
            })
          },
        })
      }
    } finally {
      adapter.allowAdditionalKeys = previousAllowAdditionalKeys
    }
  })

  it.each([false, true])(
    'should pin native near history and drafts with a caller transaction: %s',
    async (hasCallerTransaction) => {
      const point = { type: 'Point', coordinates: [0, 0] }
      const far = { type: 'Point', coordinates: [10, 10] }
      const parentVersionID = new mongoose.Types.ObjectId()
      const globalVersionID = new mongoose.Types.ObjectId()
      await connection.db!.collection('versions_parents').insertMany([
        {
          _id: parentVersionID,
          parent: parentID,
          latest: true,
          version: { title: 'old', position: point },
        },
        {
          parent: new mongoose.Types.ObjectId(),
          latest: true,
          version: { title: 'far', position: far },
        },
      ])
      await connection.db!.collection('versions_settings').insertMany([
        { _id: globalVersionID, latest: true, version: { position: point } },
        { latest: true, version: { position: far } },
      ])
      const req = request()
      const session = hasCallerTransaction ? connection.getClient().startSession() : undefined
      if (session) {
        session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        })
        adapter.sessions.geoHistory = session as never
        req.transactionID = 'geoHistory'
        await connection.db!.collection('targets').findOne({ _id: targetID }, { session })
      }
      try {
        await adapter.branching!.withReadSnapshot!({
          req,
          read: async ({ req }) => {
            for (const name of ['versions_parents', 'versions_settings']) {
              await connection
                .db!.collection(name)
                .updateMany(
                  { 'version.position.coordinates': [0, 0] },
                  { $set: { 'version.position': far } },
                )
              await connection.db!.collection(name).insertOne({
                latest: true,
                parent: new mongoose.Types.ObjectId(),
                version: { position: point },
              })
            }
            const where = { 'version.position': { near: [0, 0, 1000] } }
            const history = await req.payload.db.findVersions({
              collection: 'parents',
              where,
              limit: 1,
              req,
            })
            expect(history.totalDocs).toBe(1)
            expect(history.docs.map(({ id }) => id)).toEqual([parentVersionID.toHexString()])
            expect(
              await req.payload.db.countVersions({ collection: 'parents', where, req }),
            ).toEqual({
              totalDocs: 1,
            })
            const globals = await req.payload.db.findGlobalVersions({
              global: 'settings',
              where,
              limit: 1,
              req,
            })
            expect(globals.totalDocs).toBe(1)
            expect(globals.docs.map(({ id }) => id)).toEqual([globalVersionID.toHexString()])
            expect(
              await req.payload.db.countGlobalVersions({ global: 'settings', where, req }),
            ).toEqual({ totalDocs: 1 })
            for (const isAggregated of [false, true]) {
              adapter.useJoinAggregations = isAggregated
              const drafts = await req.payload.db.queryDrafts({
                collection: 'parents',
                where,
                limit: 1,
                req,
                joins: false,
              })
              expect(drafts.totalDocs).toBe(1)
              expect(drafts.docs.map(({ id }) => id)).toEqual([parentID.toHexString()])
            }
          },
        })
        expect(session?.inTransaction() ?? false).toBe(hasCallerTransaction)
      } finally {
        if (session) {
          await session.abortTransaction()
          await session.endSession()
          delete adapter.sessions.geoHistory
        }
      }
    },
  )

  it('should compile root and related access near predicates before native lookup matches', async () => {
    const otherTarget = new mongoose.Types.ObjectId()
    const otherParent = new mongoose.Types.ObjectId()
    await connection.db!.collection('targets').insertOne({
      _id: otherTarget,
      title: 'far',
      position: { type: 'Point', coordinates: [10, 10] },
    })
    await connection.db!.collection('parents').insertOne({
      _id: otherParent,
      title: 'parent',
      target: otherTarget,
      position: { type: 'Point', coordinates: [10, 10] },
    })
    for (const isAggregated of [false, true]) {
      adapter.useJoinAggregations = isAggregated
      const ordinary = await payload.find({
        collection: 'parents',
        where: { 'target.position': { near: [0, 0, 1000] } },
        depth: 0,
        overrideAccess: false,
      })
      expect(ordinary.docs.map(({ id }) => id)).toEqual([parentID.toHexString()])
    }
    await adapter.branching!.withReadSnapshot!({
      req: request(),
      read: async ({ req }) => {
        await connection
          .db!.collection('targets')
          .updateOne(
            { _id: targetID },
            { $set: { position: { type: 'Point', coordinates: [20, 20] } } },
          )
        await connection
          .db!.collection('parents')
          .updateOne(
            { _id: parentID },
            { $set: { position: { type: 'Point', coordinates: [20, 20] } } },
          )
        const run = async ({
          access = {},
          targetAccess = {},
          where = {},
        }: {
          access?: false | Where
          targetAccess?: false | Where
          where?: Where
        }) => {
          const result = await req.payload.db.branching!.queryProjection!.find({
            collection: 'parents',
            context: {
              branchKey: 'staging',
              relationAccess: { parents: access, targets: targetAccess, children: {} },
            } as never,
            where,
            req,
            joins: false,
            sort: 'id',
          })
          return result.docs
        }
        expect(
          (await run({ access: { position: { near: [0, 0, 1000] } } })).map(({ id }) => String(id)),
        ).toEqual([String(parentID)])
        expect(
          (
            await run({
              targetAccess: { position: { near: [0, 0, 1000] } },
              where: { 'target.title': { equals: 'old' } },
            })
          ).map(({ id }) => String(id)),
        ).toEqual([String(parentID)])
        expect(
          (await run({ where: { 'target.position': { near: [0, 0, 1000] } } })).map(({ id }) =>
            String(id),
          ),
        ).toEqual([String(parentID)])
        // The access expression itself is trusted and does not recursively apply target read policies.
        expect(
          (
            await run({
              access: { 'target.position': { near: [0, 0, 1000] } },
              targetAccess: false,
            })
          ).map(({ id }) => String(id)),
        ).toEqual([String(parentID)])
        expect(
          await run({ where: { 'target.position': { near: [0, 0, 1000] } }, targetAccess: false }),
        ).toEqual([])
      },
    })
  })

  it('should apply branch visibility before root and target near predicates', async () => {
    const parentConfig = payload.collections.parents!.config
    const targetConfig = payload.collections.targets!.config
    const previousParentCustom = parentConfig.custom
    const previousTargetCustom = targetConfig.custom
    parentConfig.custom = {
      ...previousParentCustom,
      branchProjectionStorage: { collection: 'parents' },
    }
    targetConfig.custom = {
      ...previousTargetCustom,
      branchProjectionStorage: { collection: 'targets' },
    }
    const visible = { branchKey: 'staging', isVisible: true }
    const point = { type: 'Point', coordinates: [0, 0] }
    await connection
      .db!.collection('parents')
      .updateOne({ _id: parentID }, { $set: { _branchProjection: visible } })
    await connection
      .db!.collection('targets')
      .updateOne({ _id: targetID }, { $set: { _branchProjection: visible } })
    await connection.db!.collection('parents').insertMany([
      { title: 'hidden', position: point, _branchProjection: { ...visible, isVisible: false } },
      { title: 'main', position: point, _branchProjection: { ...visible, branchKey: 'main' } },
    ])
    const hiddenTarget = new mongoose.Types.ObjectId()
    await connection.db!.collection('targets').insertOne({
      _id: hiddenTarget,
      title: 'old',
      position: point,
      _branchProjection: { ...visible, isVisible: false },
    })
    await connection
      .db!.collection('parents')
      .insertOne({ title: 'hidden-target', target: hiddenTarget, _branchProjection: visible })
    try {
      await adapter.branching!.withReadSnapshot!({
        req: request(),
        read: async ({ req }) => {
          const query = async ({ access, where }: { access?: Where; where?: Where }) =>
            req.payload.db.branching!.queryProjection!.find({
              collection: 'parents',
              context: {
                branchKey: 'staging',
                relationAccess: {
                  parents: access ?? {},
                  targets: { position: { near: [0, 0, 1000] } },
                },
              },
              where,
              req,
              joins: false,
              sort: 'title',
            })
          const root = await query({ access: { position: { near: [0, 0, 1000] } } })
          expect(root.docs.map(({ id }) => id)).toEqual([parentID.toHexString()])
          const related = await query({ where: { 'target.title': { equals: 'old' } } })
          expect(related.docs.map(({ id }) => id)).toEqual([parentID.toHexString()])
        },
      })
    } finally {
      parentConfig.custom = previousParentCustom
      targetConfig.custom = previousTargetCustom
    }
  })

  it('should serialize native caller transaction reads across both join engines and count empty filters', async () => {
    const session = connection.getClient().startSession()
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    })
    adapter.sessions.caller = session as never
    const req = request()
    req.transactionID = 'caller'
    const active = new Set<number>()
    let maxActive = 0
    const client = connection.getClient()
    const started = (event: {
      command: { lsid?: unknown; txnNumber?: unknown }
      requestId: number
    }) => {
      if (
        event.command.txnNumber === undefined ||
        JSON.stringify(event.command.lsid) !== JSON.stringify(session.id)
      ) {
        return
      }
      active.add(event.requestId)
      maxActive = Math.max(maxActive, active.size)
    }
    const ended = (event: { requestId: number }) => {
      active.delete(event.requestId)
    }
    client.on('commandStarted', started)
    client.on('commandSucceeded', ended)
    client.on('commandFailed', ended)
    try {
      parentHook.mockImplementation(async ({ doc, req }: any) => {
        await req.payload.find({ collection: 'targets', depth: 0, overrideAccess: false })
        return doc
      })
      await connection.db!.collection('targets').findOne({ _id: targetID }, { session })
      await changeAfterPin()
      for (const isAggregated of [false, true]) {
        adapter.useJoinAggregations = isAggregated
        await adapter.branching!.withReadSnapshot!({
          req,
          read: async ({ req }) => {
            const [found, parallel] = await Promise.all([
              payload.find({
                collection: 'parents',
                depth: 0,
                limit: 1,
                req,
                overrideAccess: false,
                joins: { children: { count: true }, otherChildren: { count: true } },
              }),
              req.payload.find({ collection: 'targets', depth: 0, req, overrideAccess: false }),
            ])
            expect(parallel.docs).toHaveLength(1)
            expect(found.docs[0].children.docs).toEqual([childID.toHexString()])
            expect(found.totalDocs).toBe(1)
            expect((await req.payload.db.count({ collection: 'targets', req })).totalDocs).toBe(1)
          },
        })
      }
      expect(maxActive).toBe(1)
      expect(session.inTransaction()).toBe(true)
    } finally {
      client.off('commandStarted', started)
      client.off('commandSucceeded', ended)
      client.off('commandFailed', ended)
      await session.abortTransaction()
      await session.endSession()
      delete adapter.sessions.caller
    }
  })
})
