import type { DeleteMany } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { buildFindManyArgs } from './find/buildFindManyArgs'
import buildQuery from './queries/buildQuery'
import { transform } from './transform/read'

export const deleteMany: DeleteMany = async function deleteMany(
  this: PostgresAdapter,
  { collection, req = {} as PayloadRequest, where: incomingWhere },
) {
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

  const docsToDelete = await this.db.query[tableName].findMany(findManyArgs)

  const result = docsToDelete.map((data) => {
    return transform({
      config: this.payload.config,
      data,
      fields: collectionConfig.fields,
    })
  })

  await this.db.delete(this.tables[tableName]).where(where)

  return result
}
