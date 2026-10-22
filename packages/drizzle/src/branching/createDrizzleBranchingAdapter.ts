import type { BranchingAdapter, JsonObject, TypeWithVersion } from 'payload'

import { and, eq, isNull } from 'drizzle-orm'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, TransactionSQLite } from '../types.js'
import type { WithReadTransaction } from './createReadSnapshot.js'

import { buildFindManyArgs } from '../find/buildFindManyArgs.js'
import { transform } from '../transform/read/index.js'
import { upsertRow } from '../upsertRow/index.js'
import { markWrite } from '../utilities/readAfterWrite.js'
import { completeBranchVersionData } from './completeBranchVersionData.js'
import { createProjectionQueries } from './createProjectionQueries.js'
import { createReadSnapshot } from './createReadSnapshot.js'

/** The wrapper supplies configuration support; the connected driver must also support transactions. */
export const createDrizzleBranchingAdapter = ({
  adapter,
  isTransactionConfigured,
  unsupportedReason,
  withReadTransaction,
}: {
  adapter: DrizzleAdapter
  isTransactionConfigured: boolean
  unsupportedReason?: string
  withReadTransaction?: WithReadTransaction
}): BranchingAdapter => ({
  capabilities: () => {
    const hasInteractiveTransactions =
      isTransactionConfigured && typeof adapter.drizzle?.transaction === 'function'

    return Promise.resolve({
      atomicBatch: false,
      interactiveTransactions: hasInteractiveTransactions,
      ...(hasInteractiveTransactions
        ? {}
        : { reason: unsupportedReason || 'Interactive transactions are disabled or unavailable.' }),
    })
  },
  mutateVersion: async ({ entity, expected, mutation, req }) => {
    if (!isTransactionConfigured || typeof adapter.drizzle?.transaction !== 'function') {
      throw new Error(
        unsupportedReason || 'Branch version mutation requires interactive transactions.',
      )
    }

    const transactionID = await req.transactionID
    const db = transactionID == null ? undefined : adapter.sessions[transactionID]?.db

    if (!db) {
      throw new Error('Branch version mutation requires an active caller transaction.')
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

    if (!Number.isSafeInteger(expected.generation) || expected.generation < 0) {
      throw new Error('Invalid expected branch version generation.')
    }

    const config =
      entity.type === 'collection'
        ? adapter.payload.collections[entity.slug]?.config
        : adapter.payload.globals.config.find(({ slug }) => slug === entity.slug)

    if (!config?.custom?.branchStorage) {
      throw new Error('Branch version mutation requires a configured branch storage entity.')
    }

    const tableName = adapter.tableNameMap.get(
      `_${toSnakeCase(entity.slug)}${adapter.versionsSuffix}`,
    )
    const table = adapter.tables[tableName]
    const fields =
      entity.type === 'collection'
        ? buildVersionCollectionFields(
            adapter.payload.config,
            adapter.payload.collections[entity.slug].config,
            true,
          )
        : buildVersionGlobalFields(
            adapter.payload.config,
            adapter.payload.globals.config.find(({ slug }) => slug === entity.slug),
            true,
          )

    if (
      typeof expected.id !== table.id.dataType ||
      (entity.type === 'collection' && typeof entity.parentID !== table.parent.dataType)
    ) {
      throw new Error('Branch version IDs must match their database column types.')
    }

    const predicates = [eq(table.id, expected.id)]

    if (entity.type === 'collection') {
      predicates.push(eq(table.parent, entity.parentID))
    }

    let metadata: Record<string, unknown>

    if (mutation.type === 'initialize') {
      if (
        expected.generation !== 0 ||
        typeof mutation.ownerKey !== 'string' ||
        !mutation.ownerKey ||
        typeof mutation.isFrozen !== 'boolean'
      ) {
        throw new Error('Branch version initialization requires generation zero and an owner.')
      }

      predicates.push(isNull(table.branchGeneration))
      metadata = {
        branchFrozen: mutation.isFrozen,
        branchGeneration: 1,
        branchOwnerKey: mutation.ownerKey,
      }
    } else {
      if (expected.generation < 1) {
        throw new Error('A managed branch version requires a positive generation.')
      }

      predicates.push(eq(table.branchGeneration, expected.generation))

      if (mutation.type === 'freeze') {
        metadata = { branchFrozen: true }
      } else {
        if (
          typeof mutation.ownerKey !== 'string' ||
          !mutation.ownerKey ||
          expected.generation === Number.MAX_SAFE_INTEGER
        ) {
          throw new Error('Invalid branch version replacement owner or generation.')
        }

        predicates.push(eq(table.branchFrozen, false), eq(table.branchOwnerKey, mutation.ownerKey))
        metadata = { branchGeneration: expected.generation + 1 }
      }
    }

    // This root write locks and checks ownership before any nested/localized rows can change.
    const rows = await (db as TransactionSQLite)
      .update(table)
      .set(metadata)
      .where(and(...predicates))
      .returning({ id: table.id })

    if (!rows.length) {
      return null
    }

    markWrite(adapter)

    const query = buildFindManyArgs({ adapter, depth: 0, fields, joinQuery: false, tableName })
    const data = await db.query[tableName].findFirst({ ...query, where: eq(table.id, expected.id) })
    const current = transform<TypeWithVersion<JsonObject>>({
      adapter,
      config: adapter.payload.config,
      data,
      fields,
      tableName,
    })

    if (mutation.type === 'replace') {
      const versionField = fields.find((field) => field.name === 'version')

      if (versionField.type !== 'group') {
        throw new Error('Branch version storage requires the version group.')
      }

      return upsertRow<TypeWithVersion<JsonObject>>({
        id: expected.id,
        adapter,
        ...(entity.type === 'collection'
          ? { collectionSlug: entity.slug }
          : { globalSlug: entity.slug }),
        data: {
          branchGeneration: expected.generation + 1,
          ...(mutation.envelope
            ? {
                updatedAt: mutation.envelope.updatedAt,
                ...(mutation.envelope.latest !== undefined
                  ? { latest: mutation.envelope.latest }
                  : {}),
              }
            : {}),
          version: completeBranchVersionData({
            fields: versionField.flattenedFields,
            previous: current.version,
            replacement: mutation.data,
          }),
        },
        db,
        fields,
        operation: 'update',
        req,
        tableName,
        where: and(eq(table.id, expected.id), eq(table.branchGeneration, expected.generation + 1)),
      })
    }

    return current
  },
  queryProjection: createProjectionQueries({ adapter }),
  withReadSnapshot: createReadSnapshot({ adapter, withReadTransaction }),
})
