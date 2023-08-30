import type { PaginateOptions } from 'mongoose'
import type { QueryDrafts } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { flattenWhereToOperators } from 'payload/database'

import type { MongooseAdapter } from './index.js'

import { buildSortParam } from './queries/buildSortParam.js'
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

type AggregateVersion<T> = {
  _id: string
  createdAt: string
  updatedAt: string
  version: T
}

export const queryDrafts: QueryDrafts = async function queryDrafts<T>(
  this: MongooseAdapter,
  { collection, limit, locale, page, pagination, req = {} as PayloadRequest, sort: sortArg, where },
) {
  const VersionModel = this.versions[collection]
  const collectionConfig = this.payload.collections[collection].config
  const options = withSession(this, req.transactionID)

  const versionQuery = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  let hasNearConstraint = false

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  let sort
  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields: collectionConfig.fields,
      locale,
      sort: sortArg || collectionConfig.defaultSort,
      timestamps: true,
    })
  }

  const aggregate = VersionModel.aggregate<AggregateVersion<T>>(
    [
      // Sort so that newest are first
      { $sort: { updatedAt: -1 } },
      // Group by parent ID, and take the first of each
      {
        $group: {
          _id: '$parent',
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          version: { $first: '$version' },
        },
      },
      // Filter based on incoming query
      { $match: versionQuery },
    ],
    {
      ...options,
      allowDiskUse: true,
    },
  )

  let result

  if (pagination) {
    let useEstimatedCount

    if (where) {
      const constraints = flattenWhereToOperators(where)
      useEstimatedCount = constraints.some((prop) =>
        Object.keys(prop).some((key) => key === 'near'),
      )
    }

    const aggregatePaginateOptions: PaginateOptions = {
      lean: true,
      leanWithId: true,
      limit,
      options: {
        ...options,
        limit,
      },
      page,
      pagination,
      sort,
      useCustomCountFn: pagination ? undefined : () => Promise.resolve(1),
      useEstimatedCount,
      useFacet: this.connectOptions.useFacet,
    }

    result = await VersionModel.aggregatePaginate(aggregate, aggregatePaginateOptions)
  } else {
    result = aggregate.exec()
  }

  const docs = JSON.parse(JSON.stringify(result.docs))

  return {
    ...result,
    docs: docs.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc = {
        _id: doc._id,
        id: doc._id,
        ...doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }

      return sanitizeInternalFields(doc)
    }),
  }
}
