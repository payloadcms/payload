import type { PaginateOptions } from 'mongoose'
import type { FindGlobalVersions, PayloadRequestWithData } from 'payload'

import { buildVersionGlobalFields, flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildSortParam } from './queries/buildSortParam.js'
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: MongooseAdapter,
  {
    global,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequestWithData,
    skip,
    sort: sortArg,
    where,
  },
) {
  const Model = this.versions[global]
  const versionFields = buildVersionGlobalFields(
    this.payload.globals.config.find(({ slug }) => slug === global),
  )
  const options = {
    ...withSession(this, req.transactionID),
    limit,
    skip,
  }

  let hasNearConstraint = false

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  let sort
  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields: versionFields,
      locale,
      sort: sortArg || '-updatedAt',
      timestamps: true,
    })
  }

  const query = await Model.buildQuery({
    globalSlug: global,
    locale,
    payload: this.payload,
    where,
  })

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0
  const paginationOptions: PaginateOptions = {
    forceCountFn: hasNearConstraint,
    lean: true,
    leanWithId: true,
    offset: skip,
    options,
    page,
    pagination,
    sort,
    useEstimatedCount,
  }

  if (!useEstimatedCount && Object.keys(query).length === 0 && this.disableIndexHints !== true) {
    // Improve the performance of the countDocuments query which is used if useEstimatedCount is set to false by adding
    // a hint. By default, if no hint is provided, MongoDB does not use an indexed field to count the returned documents,
    // which makes queries very slow. This only happens when no query (filter) is provided. If one is provided, it uses
    // the correct indexed field
    paginationOptions.useCustomCountFn = () => {
      return Promise.resolve(
        Model.countDocuments(query, {
          ...options,
          hint: { _id: 1 },
        }),
      )
    }
  }

  if (limit >= 0) {
    paginationOptions.limit = limit
    // limit must also be set here, it's ignored when pagination is false
    paginationOptions.options.limit = limit

    // Disable pagination if limit is 0
    if (limit === 0) {
      paginationOptions.pagination = false
    }
  }

  const result = await Model.paginate(query, paginationOptions)
  const docs = JSON.parse(JSON.stringify(result.docs))

  return {
    ...result,
    docs: docs.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc.id = doc._id
      return sanitizeInternalFields(doc)
    }),
  }
}
