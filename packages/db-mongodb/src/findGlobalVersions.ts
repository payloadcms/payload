import type { CollationOptions } from 'mongodb'
import type { FindGlobalVersions, PayloadRequest } from 'payload'

import { buildVersionGlobalFields, flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildSortParam } from './queries/buildSortParam.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { findMany } from './utilities/findMany.js'
import { transform } from './utilities/transform.js'

export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: MongooseAdapter,
  {
    global,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequest,
    select,
    skip,
    sort: sortArg,
    where,
  },
) {
  const Model = this.versions[global]
  const versionFields = buildVersionGlobalFields(
    this.payload.config,
    this.payload.globals.config.find(({ slug }) => slug === global),
    true,
  )

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

  const session = await getSession(this, req)
  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0

  const projection = buildProjectionFromSelect({ adapter: this, fields: versionFields, select })

  const collation: CollationOptions | undefined = this.collation
    ? {
        locale: locale && locale !== 'all' && locale !== '*' ? locale : 'en',
        ...this.collation,
      }
    : undefined

  const result = await findMany({
    adapter: this,
    collation,
    collection: Model.collection,
    limit,
    page,
    pagination,
    projection,
    query,
    session,
    skip,
    sort,
    useEstimatedCount,
  })

  transform({
    type: 'read',
    adapter: this,
    data: result.docs,
    fields: versionFields,
  })

  return result
}
