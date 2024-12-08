import type { CollationOptions } from 'mongodb'
import type { Find, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildSortParam } from './queries/buildSortParam.js'
import { buildJoinAggregation } from './utilities/buildJoinAggregation.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { findMany } from './utilities/findMany.js'
import { getHasNearConstraint } from './utilities/getHasNearConstraint.js'
import { transform } from './utilities/transform.js'

export const find: Find = async function find(
  this: MongooseAdapter,
  {
    collection,
    joins = {},
    limit = 0,
    locale,
    page,
    pagination,
    req = {} as PayloadRequest,
    select,
    sort: sortArg,
    where,
  },
) {
  const Model = this.collections[collection]
  const collectionConfig = this.payload.collections[collection].config
  const session = await getSession(this, req)

  const hasNearConstraint = getHasNearConstraint(where)

  const fields = collectionConfig.flattenedFields

  let sort
  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields,
      locale,
      sort: sortArg || collectionConfig.defaultSort,
      timestamps: true,
    })
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    session,
    where,
  })

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0

  const projection = buildProjectionFromSelect({
    adapter: this,
    fields,
    select,
  })

  const collation: CollationOptions | undefined = this.collation
    ? {
        locale: locale && locale !== 'all' && locale !== '*' ? locale : 'en',
        ...this.collation,
      }
    : undefined

  const joinAgreggation = await buildJoinAggregation({
    adapter: this,
    collection,
    collectionConfig,
    joins,
    locale,
    session,
  })

  const result = await findMany({
    adapter: this,
    collation,
    collection: Model.collection,
    joinAgreggation,
    limit,
    page,
    pagination,
    projection,
    query,
    session,
    sort,
    useEstimatedCount,
  })

  transform({ adapter: this, data: result.docs, fields, operation: 'read' })

  return result
}
