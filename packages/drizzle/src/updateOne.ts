import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { FlattenedField, UpdateOne } from 'payload'

import { eq } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildFindManyArgs } from './find/buildFindManyArgs.js'
import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { transform } from './transform/read/index.js'
import { transformForWrite } from './transform/write/index.js'
import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

/**
 * Checks whether we should use the upsertRow function for the passed data and otherwise use a simple SQL SET call.
 * We need to use upsertRow only when the data has arrays, blocks, hasMany select/text/number, localized fields, complex relationships.
 */
const shouldUseUpsertRow = ({
  data,
  fields,
}: {
  data: Record<string, unknown>
  fields: FlattenedField[]
}) => {
  for (const key in data) {
    const value = data[key]
    const field = fields.find((each) => each.name === key)

    if (!field) {
      continue
    }

    if (
      field.type === 'array' ||
      field.type === 'blocks' ||
      ((field.type === 'text' ||
        field.type === 'relationship' ||
        field.type === 'upload' ||
        field.type === 'select' ||
        field.type === 'number') &&
        field.hasMany) ||
      ((field.type === 'relationship' || field.type === 'upload') &&
        Array.isArray(field.relationTo)) ||
      field.localized
    ) {
      return true
    }

    if (
      (field.type === 'group' || field.type === 'tab') &&
      value &&
      typeof value === 'object' &&
      shouldUseUpsertRow({ data: value as Record<string, unknown>, fields: field.flattenedFields })
    ) {
      return true
    }
  }

  return false
}

export const updateOne: UpdateOne = async function updateOne(
  this: DrizzleAdapter,
  {
    id,
    collection: collectionSlug,
    data,
    joins: joinQuery,
    locale,
    options = { upsert: false },
    req,
    returning,
    select,
    where: whereArg,
  },
) {
  const db = await getTransaction(this, req)
  const collection = this.payload.collections[collectionSlug].config
  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
  let idToUpdate = id

  if (!idToUpdate) {
    const { joins, selectFields, where } = buildQuery({
      adapter: this,
      fields: collection.flattenedFields,
      locale,
      tableName,
      where: whereArg,
    })

    // selectDistinct will only return if there are joins
    const selectDistinctResult = await selectDistinct({
      adapter: this,
      db,
      joins,
      query: ({ query }) => query.limit(1),
      selectFields,
      tableName,
      where,
    })

    if (selectDistinctResult?.[0]?.id) {
      idToUpdate = selectDistinctResult?.[0]?.id
      // If id wasn't passed but `where` without any joins, retrieve it with findFirst
    } else if (whereArg && !joins.length) {
      const table = this.tables[tableName]

      const docsToUpdate = await (db as LibSQLDatabase)
        .select({
          id: table.id,
        })
        .from(table)
        .where(where)
        .limit(1)
      idToUpdate = docsToUpdate?.[0]?.id
    }
  }

  if (!idToUpdate && !options.upsert) {
    // TODO: In 4.0, if returning === false, we should differentiate between:
    // - No document found to update
    // - Document found, but returning === false
    return null
  }

  if (!idToUpdate || shouldUseUpsertRow({ data, fields: collection.flattenedFields })) {
    const result = await upsertRow({
      id: idToUpdate,
      adapter: this,
      data,
      db,
      fields: collection.flattenedFields,
      ignoreResult: returning === false,
      joinQuery,
      operation: 'update',
      req,
      select,
      tableName,
    })

    if (returning === false) {
      return null
    }

    return result
  }

  const { row } = transformForWrite({
    adapter: this,
    data,
    enableAtomicWrites: true,
    fields: collection.flattenedFields,
    tableName,
  })

  const drizzle = db as LibSQLDatabase
  await drizzle
    .update(this.tables[tableName])
    .set(row)
    // TODO: we can skip fetching idToUpdate here with using the incoming where
    .where(eq(this.tables[tableName].id, idToUpdate))

  if (returning === false) {
    return null
  }

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collection.flattenedFields,
    joinQuery: false,
    select,
    tableName,
  })

  findManyArgs.where = eq(this.tables[tableName].id, idToUpdate)

  const doc = await db.query[tableName].findFirst(findManyArgs)

  // //////////////////////////////////
  // TRANSFORM DATA
  // //////////////////////////////////

  const result = transform({
    adapter: this,
    config: this.payload.config,
    data: doc,
    fields: collection.flattenedFields,
    joinQuery: false,
    tableName,
  })

  return result
}
