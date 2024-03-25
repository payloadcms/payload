import type { DeleteOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { eq } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import { buildFindManyArgs } from './find/buildFindManyArgs.js'
import buildQuery from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { transform } from './transform/read/index.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: PostgresAdapter,
  { collection: collectionSlug, req = {} as PayloadRequest, where: whereArg },
) {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const collection = this.payload.collections[collectionSlug].config
  const tableName = toSnakeCase(collectionSlug)
  let docToDelete: Record<string, unknown>

  const { joinAliases, joins, selectFields, where } = await buildQuery({
    adapter: this,
    fields: collection.fields,
    locale: req.locale,
    tableName,
    where: whereArg,
  })

  const selectDistinctResult = selectDistinct({
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
