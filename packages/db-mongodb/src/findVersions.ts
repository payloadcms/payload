import type { CollationOptions } from 'mongodb'
import type { FindVersions, PayloadRequest } from 'payload'

import { buildVersionCollectionFields } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildSortParam } from './queries/buildSortParam.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { findMany } from './utilities/findMany.js'
import { getHasNearConstraint } from './utilities/getHasNearConstraint.js'
import { transform } from './utilities/transform.js'

export const findVersions: FindVersions = async function findVersions(
  this: MongooseAdapter,
  {
    collection,
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
  const Model = this.versions[collection]
  const collectionConfig = this.payload.collections[collection].config

  const session = await getSession(this, req)

  const hasNearConstraint = getHasNearConstraint(where)

  let sort
  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields: collectionConfig.flattenedFields,
      locale,
      sort: sortArg || '-updatedAt',
      timestamps: true,
    })
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    session,
    where,
  })

  const versionFields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)
  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0

  const projection = buildProjectionFromSelect({
    adapter: this,
    fields: versionFields,
    select,
  })

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
    adapter: this,
    data: result.docs,
    fields: versionFields,
    operation: 'read',
  })

  return result
}
