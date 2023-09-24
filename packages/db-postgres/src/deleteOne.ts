import type { DeleteOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { buildFindManyArgs } from './find/buildFindManyArgs'
import buildQuery from './queries/buildQuery'
import { transform } from './transform/read'

export const deleteOne: DeleteOne = async function deleteOne(
  this: PostgresAdapter,
  { collection, req = {} as PayloadRequest, where: incomingWhere },
) {
  const db = this.sessions[req.transactionID] || this.db
  const collectionConfig = this.payload.collections[collection].config
  const tableName = toSnakeCase(collection)

  const { where } = await buildQuery({
    adapter: this,
    fields: collectionConfig.fields,
    tableName,
    where: incomingWhere,
  })

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collectionConfig.fields,
    tableName,
  })

  findManyArgs.where = where

  const docToDelete = await db.query[tableName].findFirst(findManyArgs)

  const result = transform({
    config: this.payload.config,
    data: docToDelete,
    fields: collectionConfig.fields,
  })

  await db.delete(this.tables[tableName]).where(where)

  return result
}
