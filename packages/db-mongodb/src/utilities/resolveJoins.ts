import type { JoinQuery, SanitizedJoin } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { buildQuery } from '../queries/buildQuery.js'
import { buildSortParam } from '../queries/buildSortParam.js'

type Args = {
  adapter: MongooseAdapter
  collectionSlug: string
  docs: Record<string, unknown>[]
  joins?: JoinQuery
  locale?: string
}

function getByPath(doc: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((val, segment) => {
    if (val === undefined || val === null) {
      return undefined
    }
    return (val as Record<string, unknown>)[segment]
  }, doc)
}

export async function resolveJoins({
  adapter,
  collectionSlug,
  docs,
  joins,
  locale,
}: Args): Promise<void> {
  if (!joins || joins === false || docs.length === 0) {
    return
  }

  const collectionConfig = adapter.payload.collections[collectionSlug]?.config
  if (!collectionConfig) {
    return
  }

  const joinMap: Record<string, { targetCollection: string } & SanitizedJoin> = {}

  for (const [target, joinList] of Object.entries(collectionConfig.joins)) {
    for (const join of joinList || []) {
      joinMap[join.joinPath] = { ...join, targetCollection: target }
    }
  }

  for (const [joinPath, joinQuery] of Object.entries(joins)) {
    if (joinQuery === false) {
      continue
    }
    const joinDef = joinMap[joinPath]
    if (!joinDef) {
      continue
    }

    const targetConfig = adapter.payload.collections[joinDef.field.collection as string]?.config
    const JoinModel = adapter.collections[joinDef.field.collection as string]
    if (!targetConfig || !JoinModel) {
      continue
    }

    const parentIDs = docs.map((d) => d._id ?? d.id)

    const whereQuery = await buildQuery({
      adapter,
      collectionSlug: joinDef.field.collection as string,
      fields: targetConfig.flattenedFields,
      locale,
      where: joinQuery.where || {},
    })

    whereQuery[joinDef.field.on] = { $in: parentIDs }

    const sort = buildSortParam({
      adapter,
      config: adapter.payload.config,
      fields: targetConfig.flattenedFields,
      locale,
      sort: joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort,
      timestamps: true,
    })

    const results = await JoinModel.find(whereQuery, null).sort(sort).lean()

    const grouped: Record<string, Record<string, unknown>[]> = {}

    for (const res of results) {
      const parent = getByPath(res, joinDef.field.on)
      if (!parent) {
        continue
      }
      if (!grouped[parent as string]) {
        grouped[parent as string] = []
      }
      grouped[parent as string].push(res)
    }

    const limit = joinQuery.limit ?? joinDef.field.defaultLimit ?? 10
    const page = joinQuery.page ?? 1

    for (const doc of docs) {
      const id = doc._id ?? doc.id
      const all = grouped[id] || []
      const slice = all.slice((page - 1) * limit, (page - 1) * limit + limit)
      const value: Record<string, unknown> = {
        docs: slice,
        hasNextPage: all.length > (page - 1) * limit + slice.length,
      }
      if (joinQuery.count) {
        value.totalDocs = all.length
      }
      const segments = joinPath.split('.')
      let ref = doc
      for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i]
        if (!ref[seg]) {
          ref[seg] = {}
        }
        ref = ref[seg]
      }
      ref[segments[segments.length - 1]] = value
    }
  }
}
