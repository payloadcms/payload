import type { BranchingAdapter, JsonObject } from 'payload'

import mongoose from 'mongoose'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { buildQuery } from '../queries/buildQuery.js'
import { getCollection, getGlobal } from '../utilities/getEntity.js'
import { getSession } from '../utilities/getSession.js'
import { transform } from '../utilities/transform.js'
import { createProjectionQueries } from './createProjectionQueries.js'
import { createReadSnapshot } from './createReadSnapshot.js'

export const createBranchingAdapter = ({
  adapter,
  isTransactionsEnabled,
}: {
  adapter: MongooseAdapter
  isTransactionsEnabled: boolean
}): BranchingAdapter => {
  let verifiedDB: MongooseAdapter['connection']['db'] | undefined
  let verification: Promise<boolean> | undefined
  const clearVerification = () => {
    verifiedDB = undefined
    verification = undefined
  }
  const capabilities: BranchingAdapter['capabilities'] = async ({ req }) => {
    if (!isTransactionsEnabled || adapter.transactionOptions === false) {
      return unsupported({ reason: 'MongoDB transactions are disabled.' })
    }

    if (adapter.connection?.readyState !== mongoose.STATES.connected || !adapter.connection.db) {
      clearVerification()
      return unsupported({ reason: 'MongoDB is not connected.' })
    }

    try {
      if (verifiedDB !== adapter.connection.db || !verification) {
        verifiedDB = adapter.connection.db
        adapter.connection.once?.('disconnected', clearVerification)
        verification = adapter.connection.db.command({ hello: 1 }).then((hello) => {
          const isReplicaSet = typeof hello.setName === 'string' && hello.setName.length > 0
          const isSharded = hello.msg === 'isdbgrid'
          const hasSessions = typeof hello.logicalSessionTimeoutMinutes === 'number'

          return (
            hasSessions &&
            ((isReplicaSet && hello.maxWireVersion >= 7) ||
              (isSharded && hello.maxWireVersion >= 8))
          )
        })
      }

      if (!(await verification)) {
        return unsupported({
          reason: 'The connected MongoDB deployment does not support transactions.',
        })
      }

      if (req && !(await getSession(adapter, req))?.inTransaction()) {
        return unsupported({ reason: 'An active caller-owned MongoDB transaction is required.' })
      }

      return { atomicBatch: false, interactiveTransactions: true }
    } catch {
      clearVerification()
      return unsupported({ reason: 'MongoDB transaction support could not be verified.' })
    }
  }

  return {
    capabilities,
    mutateVersion: async ({ entity, expected, mutation, req }) => {
      const support = await capabilities({ req })

      if (!support.interactiveTransactions) {
        throw new Error(support.reason)
      }

      const session = await getSession(adapter, req)

      if (!session?.inTransaction()) {
        throw new Error('An active caller-owned MongoDB transaction is required.')
      }

      if (
        !Number.isSafeInteger(expected.generation) ||
        expected.generation < 0 ||
        (mutation.type !== 'initialize' && expected.generation < 1) ||
        (mutation.type === 'initialize' && expected.generation !== 0) ||
        typeof expected.id !== 'string' ||
        !expected.id
      ) {
        throw new Error('Invalid branch version identity or generation.')
      }

      if (
        mutation.type !== 'freeze' &&
        (typeof mutation.ownerKey !== 'string' || !mutation.ownerKey)
      ) {
        throw new Error('Branch version ownership must be non-empty.')
      }

      if (
        mutation.type === 'replace' &&
        mutation.envelope &&
        (typeof mutation.envelope.updatedAt !== 'string' ||
          !Number.isFinite(Date.parse(mutation.envelope.updatedAt)) ||
          (mutation.envelope.latest !== undefined && typeof mutation.envelope.latest !== 'boolean'))
      ) {
        throw new Error('Branch replacement requires a valid history envelope.')
      }

      if (mutation.type === 'initialize' && typeof mutation.isFrozen !== 'boolean') {
        throw new Error('Branch version frozen state must be boolean.')
      }

      const target =
        entity.type === 'collection'
          ? getCollection({ adapter, collectionSlug: entity.slug, versions: true })
          : getGlobal({ adapter, globalSlug: entity.slug, versions: true })
      const config = 'collectionConfig' in target ? target.collectionConfig : target.globalConfig
      const storage = config.custom?.branchStorage

      if (
        !storage ||
        typeof storage !== 'object' ||
        !['heads', 'pins', 'identities'].every((key) => typeof storage[key] === 'string')
      ) {
        throw new Error('The entity is not configured for branch version storage.')
      }

      for (const [key, markerKey] of [
        ['heads', 'branchHeadStorage'],
        ['pins', 'branchPinStorage'],
        ['identities', 'branchIdentityStorage'],
      ] as const) {
        const marker = adapter.payload.collections[storage[key]]?.config.custom?.[markerKey]

        if (
          !marker ||
          marker.parentCollection !== (entity.type === 'collection' ? entity.slug : null) ||
          marker.globalSlug !== (entity.type === 'global' ? entity.slug : null)
        ) {
          throw new Error('Branch storage collections do not belong to the requested entity.')
        }
      }

      if ('collectionConfig' in target) {
        const parentID = entity.type === 'collection' ? entity.parentID : undefined
        const expectedType = target.customIDType === 'number' ? 'number' : 'string'

        if (
          typeof parentID !== expectedType ||
          (typeof parentID === 'number' && !Number.isFinite(parentID)) ||
          parentID === ''
        ) {
          throw new Error('The branch version parent has an incompatible ID type.')
        }
      }

      const fields =
        'collectionConfig' in target
          ? buildVersionCollectionFields(adapter.payload.config, target.collectionConfig)
          : buildVersionGlobalFields(adapter.payload.config, target.globalConfig)
      const flattenedFields =
        'collectionConfig' in target
          ? buildVersionCollectionFields(adapter.payload.config, target.collectionConfig, true)
          : buildVersionGlobalFields(adapter.payload.config, target.globalConfig, true)
      const identity = await buildQuery({
        adapter,
        fields: flattenedFields,
        where: {
          and: [
            { id: { equals: expected.id } },
            ...(entity.type === 'collection' ? [{ parent: { equals: entity.parentID } }] : []),
          ],
        },
      })
      const conditions: Record<string, unknown> = {
        branchGeneration: mutation.type === 'initialize' ? { $exists: false } : expected.generation,
      }
      let data: JsonObject

      if (mutation.type === 'initialize') {
        data = {
          branchFrozen: mutation.isFrozen,
          branchGeneration: 1,
          branchOwnerKey: mutation.ownerKey,
        }
      } else if (mutation.type === 'freeze') {
        data = { branchFrozen: true }
      } else {
        if (expected.generation === Number.MAX_SAFE_INTEGER) {
          throw new Error('Branch version generation cannot be advanced further.')
        }

        conditions.branchFrozen = false
        conditions.branchOwnerKey = mutation.ownerKey
        data = {
          branchGeneration: expected.generation + 1,
          ...(mutation.envelope
            ? {
                updatedAt: mutation.envelope.updatedAt,
                ...(mutation.envelope.latest !== undefined
                  ? { latest: mutation.envelope.latest }
                  : {}),
              }
            : {}),
          version: structuredClone(mutation.data),
        }
        transform({ adapter, data, fields, operation: 'write' })
      }

      const doc = await target.Model.findOneAndUpdate(
        { $and: [identity, conditions] },
        { $set: data },
        { lean: true, returnDocument: 'after', session, timestamps: false },
      )

      if (!doc) {
        return null
      }

      transform({ adapter, data: doc, fields, operation: 'read' })

      return doc
    },
    queryProjection: createProjectionQueries({ adapter }),
    replaceProjection: async ({ collection, replacement, req }) => {
      const config = adapter.payload.collections[collection]?.config
      const model = adapter.collections[collection]
      const session = await getSession(adapter, req)
      if (
        !model ||
        !config?.custom?.branchProjectionStorage ||
        !session?.inTransaction() ||
        typeof replacement.id !== 'string'
      ) {
        throw new Error('Private projection replacement requires its native caller transaction.')
      }
      const data = structuredClone(replacement)
      const id = data.id
      const hasUpdatedAt = Object.hasOwn(data, 'updatedAt')
      const updatedAt = data.updatedAt
      transform({ adapter, data, fields: config.fields, operation: 'write' })
      if (hasUpdatedAt) {
        data.updatedAt = updatedAt
      } else {
        delete data.updatedAt
      }
      data._id = id
      delete data.id
      const result = await model.replaceOne({ _id: id }, data, { session, timestamps: false })
      if (result.matchedCount !== 1) {
        throw new Error('The private branch projection row is missing.')
      }
    },
    withReadSnapshot: createReadSnapshot({ adapter, isTransactionsEnabled }),
  }
}

const unsupported = ({ reason }: { reason: string }) => ({
  atomicBatch: false,
  interactiveTransactions: false,
  reason,
})
