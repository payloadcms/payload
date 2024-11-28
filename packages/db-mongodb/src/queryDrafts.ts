import type { CollationOptions } from 'mongodb'
import type { PayloadRequest, QueryDrafts } from 'payload'

import { buildVersionCollectionFields, combineQueries } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildSortParam } from './queries/buildSortParam.js'
import { buildJoinAggregation } from './utilities/buildJoinAggregation.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { findMany } from './utilities/findMany.js'
import { getHasNearConstraint } from './utilities/getHasNearConstraint.js'
import { transform } from './utilities/transform.js'

export const queryDrafts: QueryDrafts = async function queryDrafts(
  this: MongooseAdapter,
  {
    collection,
    joins,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequest,
    select,
    sort: sortArg,
    where,
  },
) {
  const VersionModel = this.versions[collection]
  const collectionConfig = this.payload.collections[collection].config
  const session = await getSession(this, req)

  const hasNearConstraint = getHasNearConstraint(where)
  let sort

  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields: collectionConfig.flattenedFields,
      locale,
      sort: sortArg || collectionConfig.defaultSort,
      timestamps: true,
    })
  }

  const combinedWhere = combineQueries({ latest: { equals: true } }, where)

  const versionQuery = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    session,
    where: combinedWhere,
  })

  const versionFields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)
  const projection = buildProjectionFromSelect({
    adapter: this,
    fields: versionFields,
    select,
  })
  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount =
    hasNearConstraint || !versionQuery || Object.keys(versionQuery).length === 0

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
    projection,
    session,
    versions: true,
  })

  const result = await findMany({
    adapter: this,
    collation,
    collection: VersionModel.collection,
    joinAgreggation,
    limit,
    page,
    pagination,
    projection,
    query: versionQuery,
    session,
    sort,
    useEstimatedCount,
  })

  transform({
    adapter: this,
    data: result.docs,
    fields: versionFields,
    operation: 'read',
  })

  for (let i = 0; i < result.docs.length; i++) {
    const id = result.docs[i].parent
    result.docs[i] = result.docs[i].version
    result.docs[i].id = id
  }

  return result
}
