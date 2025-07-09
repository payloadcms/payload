import type { FindDistinct, SanitizedCollectionConfig } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { getTransaction } from './utilities/getTransaction.js'
import { DistinctSymbol } from './utilities/rawConstraint.js'

export const findDistinct: FindDistinct = async function (this: DrizzleAdapter, args) {
  const db = await getTransaction(this, args.req)
  const sort = args.sortOrder === 'desc' ? `-${args.field}` : args.field
  const collectionConfig: SanitizedCollectionConfig =
    this.payload.collections[args.collection].config
  const page = args.page ?? 1
  const offset = args.limit ? (page - 1) * args.limit : undefined
  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  const { joins, orderBy, selectFields, where } = buildQuery({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    locale: args.locale,
    sort,
    tableName,
    where: {
      and: [
        args.where ?? {},
        {
          [args.field]: {
            equals: DistinctSymbol,
          },
        },
      ],
    },
  })

  orderBy.pop()

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    db,
    forceRun: true,
    joins,
    query: ({ query }) => {
      query = query.orderBy(() => orderBy.map(({ column, order }) => order(column)))

      if (args.limit) {
        if (offset) {
          query = query.offset(offset)
        }

        query = query.limit(args.limit)
      }

      return query
    },
    selectFields: {
      _selected: selectFields['_selected'],
    },
    tableName,
    where,
  })

  return {
    field: args.field,
    perPage: args.limit || selectDistinctResult.length,
    totalDocs: selectDistinctResult.length,
    values: selectDistinctResult.map((each) => (each as Record<string, unknown>)._selected),
  }
}
