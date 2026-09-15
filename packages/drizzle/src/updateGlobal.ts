import type { SQL } from 'drizzle-orm'
import type { UpdateGlobalArgs } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { upsertRow } from './upsertRow/index.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function updateGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug, data, req, returning, select, where: whereArg }: UpdateGlobalArgs,
): Promise<null | T> {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const db = getPrimaryDb(this, await getTransaction(this, req))
  const existingGlobal = await db.query[tableName].findFirst({})

  // A conditional update must not create a global when nothing matches.
  if (!existingGlobal && whereArg) {
    return null
  }

  let idToUpdate = existingGlobal?.id
  let whereToUse: SQL | undefined

  if (whereArg) {
    const { joins, selectFields, where } = buildQuery({
      adapter: this,
      fields: globalConfig.flattenedFields,
      locale: req?.locale ?? undefined,
      tableName,
      where: whereArg,
    })

    if (joins.length) {
      // Like updateOne, queries needing joins use a separate lookup. This check is not atomic.
      const [matchingGlobal] = await selectDistinct({
        adapter: this,
        db,
        joins,
        query: ({ query }) => query.limit(1),
        selectFields,
        tableName,
        where,
      })

      if (!matchingGlobal) {
        return null
      }

      idToUpdate = matchingGlobal.id
    } else {
      // Conditions on this table are efficiently checked during the write
      whereToUse = where
    }
  }

  const result = await upsertRow<{ globalType: string } & T>({
    ...(existingGlobal
      ? { id: idToUpdate, operation: 'update', where: whereToUse }
      : { operation: 'create' }),
    adapter: this,
    data,
    db,
    fields: globalConfig.flattenedFields,
    globalSlug: slug,
    ignoreResult: returning === false,
    req,
    select,
    tableName,
  })

  if (!result || returning === false) {
    return null
  }

  result.globalType = slug

  return result
}
