import type { PaginateOptions, QueryOptions } from 'mongoose'
import type { FindGlobalVersions } from 'payload'

import { APIError, buildVersionGlobalFields, flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildSortParam } from './queries/buildSortParam.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: MongooseAdapter,
  {
    global: globalSlug,
    limit,
    locale,
    page,
    pagination,
    req,
    select,
    skip,
    sort: sortArg,
    where = {},
  },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug, versions: true })

  const versionFields = buildVersionGlobalFields(this.payload.config, globalConfig, true)

  const session = await getSession(this, req)
  const options: QueryOptions = {
    limit,
    session,
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
      adapter: this,
      config: this.payload.config,
      fields: versionFields,
      locale,
      sort: sortArg || '-updatedAt',
      timestamps: true,
    })
  }

  const query = await buildQuery({
    adapter: this,
    fields: versionFields,
    locale,
    where,
  })

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0
  const paginationOptions: PaginateOptions = {
    lean: true,
    leanWithId: true,
    limit,
    options,
    page,
    pagination,
    projection: buildProjectionFromSelect({ adapter: this, fields: versionFields, select }),
    sort,
    useEstimatedCount,
  }

  if (this.collation) {
    const defaultLocale = 'en'
    paginationOptions.collation = {
      locale: locale && locale !== 'all' && locale !== '*' ? locale : defaultLocale,
      ...this.collation,
    }
  }

  if (!useEstimatedCount && Object.keys(query).length === 0 && this.disableIndexHints !== true) {
    // Improve the performance of the countDocuments query which is used if useEstimatedCount is set to false by adding
    // a hint. By default, if no hint is provided, MongoDB does not use an indexed field to count the returned documents,
    // which makes queries very slow. This only happens when no query (filter) is provided. If one is provided, it uses
    // the correct indexed field
    paginationOptions.useCustomCountFn = () => {
      return Promise.resolve(
        Model.countDocuments(query, {
          hint: { _id: 1 },
          session,
        }),
      )
    }
  }

  if (limit && limit >= 0) {
    paginationOptions.limit = limit
    // limit must also be set here, it's ignored when pagination is false

    paginationOptions.options!.limit = limit

    // Disable pagination if limit is 0
    if (limit === 0) {
      paginationOptions.pagination = false
    }
  }

  const result = await Model.paginate(query, paginationOptions)

  transform({
    adapter: this,
    data: result.docs,
    fields: buildVersionGlobalFields(this.payload.config, globalConfig),
    operation: 'read',
  })

  return result
}
