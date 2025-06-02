import type { DeleteOne } from 'payload'

import { eq } from 'drizzle-orm'

import type { DrizzleAdapter } from './types.js'

import { buildFindManyArgs } from './find/buildFindManyArgs.js'
import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { transform } from './transform/read/index.js'
import { getCollection, getTableQuery } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: DrizzleAdapter,
  { collection: collectionSlug, req, returning, select, where: whereArg },
) {
  const db = await getTransaction(this, req)
  const { collectionConfig, tableName } = getCollection({ adapter: this, collectionSlug })

  let docToDelete: Record<string, unknown> | undefined = undefined

  const { joins, selectFields, where } = buildQuery({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    locale: req?.locale ?? undefined,
    tableName,
    where: whereArg,
  })

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    db,
    joins,
    query: ({ query }) => query.limit(1),
    selectFields,
    tableName,
    where,
  })

  const queryTable = getTableQuery({ adapter: this, tableName })

  if (selectDistinctResult?.[0]?.id) {
    docToDelete = await queryTable.findFirst({
      where: eq(this.tables[tableName].id, selectDistinctResult[0].id),
    })
  } else {
    const findManyArgs = buildFindManyArgs({
      adapter: this,
      depth: 0,
      fields: collectionConfig.flattenedFields,
      joinQuery: false,
      select,
      tableName,
    })

    findManyArgs.where = where

    docToDelete = await queryTable.findFirst(findManyArgs)
  }

  if (!docToDelete) {
    return null
  }

  const result =
    returning === false
      ? null
      : transform({
          adapter: this,
          config: this.payload.config,
          data: docToDelete,
          fields: collectionConfig.flattenedFields,
          joinQuery: false,
          tableName,
        })

  await this.deleteWhere({
    db,
    tableName,
    where: eq(this.tables[tableName].id, docToDelete.id),
  })

  return result
}
