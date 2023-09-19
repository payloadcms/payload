import type { PaginateOptions } from 'mongoose'
import type { QueryDrafts } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { combineQueries, flattenWhereToOperators } from 'payload/database'

import type { MongooseAdapter } from '.'

import { buildSortParam } from './queries/buildSortParam'
import sanitizeInternalFields from './utilities/sanitizeInternalFields'
import { withSession } from './withSession'

export const queryDrafts: QueryDrafts = async function queryDrafts<T>(
  this: MongooseAdapter,
  { collection, limit, locale, page, pagination, req = {} as PayloadRequest, sort: sortArg, where },
) {
  const VersionModel = this.versions[collection]
  const collectionConfig = this.payload.collections[collection].config
  const options = withSession(this, req.transactionID)

  let hasNearConstraint
  let sort

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields: collectionConfig.fields,
      locale,
      sort: sortArg || collectionConfig.defaultSort,
      timestamps: true,
    })
  }

  const combinedWhere = combineQueries({ latest: { equals: true } }, where)

  const versionQuery = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    where: combinedWhere,
  })

  const paginationOptions: PaginateOptions = {
    forceCountFn: hasNearConstraint,
    lean: true,
    leanWithId: true,
    options,
    page,
    pagination,
    sort,
    useEstimatedCount: hasNearConstraint,
  }

  if (limit > 0) {
    paginationOptions.limit = limit
    // limit must also be set here, it's ignored when pagination is false
    paginationOptions.options.limit = limit
  }

  const result = await VersionModel.paginate(versionQuery, paginationOptions)
  const docs = JSON.parse(JSON.stringify(result.docs))

  return {
    ...result,
    docs: docs.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc = {
        _id: doc.parent,
        id: doc.parent,
        ...doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }

      return sanitizeInternalFields(doc)
    }),
  }
}
