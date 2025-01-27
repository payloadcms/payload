import type { DeleteOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { eq } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { buildFindManyArgs } from './find/buildFindManyArgs'
import buildQuery from './queries/buildQuery'
import { selectDistinct } from './queries/selectDistinct'
import { transform } from './transform/read'

export const deleteOne: DeleteOne = async function deleteOne(
  this: PostgresAdapter,
  { collection: collectionSlug, req = {} as PayloadRequest, where: whereArg },
) {
  const db = this.sessions[await req.transactionID]?.db || this.drizzle
  const collection = this.payload.collections[collectionSlug].config

  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))

  let docToDelete: Record<string, unknown>

  const { joinAliases, joins, selectFields, where } = await buildQuery({
    adapter: this,
    fields: collection.fields,
    locale: req.locale,
    tableName,
    where: whereArg,
  })

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    chainedMethods: [{ args: [1], method: 'limit' }],
    db,
    joinAliases,
    joins,
    selectFields,
    tableName,
    where,
  })

  if (selectDistinctResult?.[0]?.id) {
    docToDelete = await db.query[tableName].findFirst({
      where: eq(this.tables[tableName].id, selectDistinctResult[0].id),
    })
  } else {
    const findManyArgs = buildFindManyArgs({
      adapter: this,
      depth: 0,
      fields: collection.fields,
      tableName,
    })

    findManyArgs.where = where

    docToDelete = await db.query[tableName].findFirst(findManyArgs)
  }

  const result = transform({
    config: this.payload.config,
    data: docToDelete,
    fields: collection.fields,
  })

  await db.delete(this.tables[tableName]).where(eq(this.tables[tableName].id, docToDelete.id))

  return result
}
