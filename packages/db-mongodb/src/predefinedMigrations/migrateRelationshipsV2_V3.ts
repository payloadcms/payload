import type { ClientSession, Model } from 'mongoose'
import type { Field, PayloadRequest } from 'payload'

import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { getCollection, getGlobal } from '../utilities/getEntity.js'
import { getSession } from '../utilities/getSession.js'
import { transform } from '../utilities/transform.js'

const migrateModelWithBatching = async ({
  batchSize,
  db,
  fields,
  Model,
  parentIsLocalized,
  session,
}: {
  batchSize: number
  db: MongooseAdapter
  fields: Field[]
  Model: Model<any>
  parentIsLocalized: boolean
  session?: ClientSession
}): Promise<void> => {
  let hasNext = true
  let skip = 0

  while (hasNext) {
    const docs = await Model.find(
      {},
      {},
      {
        lean: true,
        limit: batchSize + 1,
        session,
        skip,
      },
    )

    if (docs.length === 0) {
      break
    }

    hasNext = docs.length > batchSize

    if (hasNext) {
      docs.pop()
    }

    for (const doc of docs) {
      transform({ adapter: db, data: doc, fields, operation: 'write', parentIsLocalized })
    }

    await Model.collection.bulkWrite(
      // @ts-expect-error bulkWrite has a weird type, insertOne, updateMany etc are required here as well.
      docs.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: doc,
          },
        },
      })),
      { session },
    )

    skip += batchSize
  }
}

const hasRelationshipOrUploadField = ({ fields }: { fields: Field[] }): boolean => {
  for (const field of fields) {
    if (field.type === 'relationship' || field.type === 'upload') {
      return true
    }

    if ('fields' in field) {
      if (hasRelationshipOrUploadField({ fields: field.fields })) {
        return true
      }
    }

    if ('blocks' in field) {
      for (const block of field.blocks) {
        if (typeof block === 'string') {
          // Skip - string blocks have been added in v3 and thus don't need to be migrated
          continue
        }
        if (hasRelationshipOrUploadField({ fields: block.fields })) {
          return true
        }
      }
    }

    if ('tabs' in field) {
      for (const tab of field.tabs) {
        if (hasRelationshipOrUploadField({ fields: tab.fields })) {
          return true
        }
      }
    }
  }

  return false
}

export async function migrateRelationshipsV2_V3({
  batchSize,
  req,
}: {
  batchSize: number
  req: PayloadRequest
}): Promise<void> {
  const { payload } = req
  const db = payload.db as MongooseAdapter
  const config = payload.config

  const session = await getSession(db, req)

  for (const collection of payload.config.collections) {
    if (hasRelationshipOrUploadField(collection)) {
      payload.logger.info(`Migrating collection "${collection.slug}"`)

      const { Model } = getCollection({ adapter: db, collectionSlug: collection.slug })

      await migrateModelWithBatching({
        batchSize,
        db,
        fields: collection.fields,
        Model,
        parentIsLocalized: false,
        session,
      })

      payload.logger.info(`Migrated collection "${collection.slug}"`)
    }

    if (collection.versions) {
      payload.logger.info(`Migrating collection versions "${collection.slug}"`)

      const { Model } = getCollection({
        adapter: db,
        collectionSlug: collection.slug,
        versions: true,
      })

      await migrateModelWithBatching({
        batchSize,
        db,
        fields: buildVersionCollectionFields(config, collection),
        Model,
        parentIsLocalized: false,
        session,
      })

      payload.logger.info(`Migrated collection versions "${collection.slug}"`)
    }
  }

  const { globals: GlobalsModel } = db

  for (const global of payload.config.globals) {
    if (hasRelationshipOrUploadField(global)) {
      payload.logger.info(`Migrating global "${global.slug}"`)

      const doc = await GlobalsModel.findOne<Record<string, unknown>>(
        {
          globalType: {
            $eq: global.slug,
          },
        },
        {},
        { lean: true, session },
      )

      // in case if the global doesn't exist in the database yet  (not saved)
      if (doc) {
        transform({
          adapter: db,
          data: doc,
          fields: global.fields,
          operation: 'write',
        })

        await GlobalsModel.collection.updateOne(
          {
            globalType: global.slug,
          },
          { $set: doc },
          { session },
        )
      }

      payload.logger.info(`Migrated global "${global.slug}"`)
    }

    if (global.versions) {
      payload.logger.info(`Migrating global versions "${global.slug}"`)

      const { Model } = getGlobal({ adapter: db, globalSlug: global.slug, versions: true })

      await migrateModelWithBatching({
        batchSize,
        db,
        fields: buildVersionGlobalFields(config, global),
        Model,
        parentIsLocalized: false,
        session,
      })

      payload.logger.info(`Migrated global versions "${global.slug}"`)
    }
  }
}
