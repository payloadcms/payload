import type { ClientSession, Model } from 'mongoose'
import type { Field, PayloadRequest, SanitizedConfig } from 'payload'

import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { sanitizeRelationshipIDs } from '../utilities/sanitizeRelationshipIDs.js'
import { withSession } from '../withSession.js'

const migrateModelWithBatching = async ({
  batchSize,
  config,
  fields,
  Model,
  session,
}: {
  batchSize: number
  config: SanitizedConfig
  fields: Field[]
  Model: Model<any>
  session: ClientSession
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
      sanitizeRelationshipIDs({ config, data: doc, fields })
    }

    await Model.collection.bulkWrite(
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

  const { session } = await withSession(db, req)

  for (const collection of payload.config.collections.filter(hasRelationshipOrUploadField)) {
    payload.logger.info(`Migrating collection "${collection.slug}"`)

    await migrateModelWithBatching({
      batchSize,
      config,
      fields: collection.fields,
      Model: db.collections[collection.slug],
      session,
    })

    payload.logger.info(`Migrated collection "${collection.slug}"`)

    if (collection.versions) {
      payload.logger.info(`Migrating collection versions "${collection.slug}"`)

      await migrateModelWithBatching({
        batchSize,
        config,
        fields: buildVersionCollectionFields(config, collection),
        Model: db.versions[collection.slug],
        session,
      })

      payload.logger.info(`Migrated collection versions "${collection.slug}"`)
    }
  }

  const { globals: GlobalsModel } = db

  for (const global of payload.config.globals.filter(hasRelationshipOrUploadField)) {
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

    sanitizeRelationshipIDs({ config, data: doc, fields: global.fields })

    await GlobalsModel.collection.updateOne(
      {
        globalType: global.slug,
      },
      { $set: doc },
      { session },
    )

    payload.logger.info(`Migrated global "${global.slug}"`)

    if (global.versions) {
      payload.logger.info(`Migrating global versions "${global.slug}"`)

      await migrateModelWithBatching({
        batchSize,
        config,
        fields: buildVersionGlobalFields(config, global),
        Model: db.versions[global.slug],
        session,
      })

      payload.logger.info(`Migrated global versions "${global.slug}"`)
    }
  }
}
