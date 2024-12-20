import type { PipelineStage } from 'mongoose'
import type { FindVersions } from 'payload'

import { buildVersionCollectionFields } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildSortParam } from './queries/buildSortParam.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { findMany } from './utilities/findMany.js'
import { getCollation } from './utilities/getCollation.js'
import { getHasNearConstraint } from './utilities/getHasNearConstraint.js'
import { getSession } from './utilities/getSession.js'
import { mergeProjections } from './utilities/mergeProjections.js'
import { transform } from './utilities/transform.js'

export const findVersions: FindVersions = async function findVersions(
  this: MongooseAdapter,
  { collection, limit, locale, page, pagination, req = {}, select, skip, sort: sortArg, where },
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

  const queryAggregation: PipelineStage[] = []
  const queryProjection = {}

  const query = await Model.buildQuery({
    aggregation: queryAggregation,
    locale,
    payload: this.payload,
    projection: queryProjection,
    session,
    where,
  })

  const versionFields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)
  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0

  const projection = mergeProjections({
    queryProjection,
    selectProjection: buildProjectionFromSelect({
      adapter: this,
      fields: versionFields,
      select,
    }),
  })

  const result = await findMany({
    adapter: this,
    collation: getCollation({ adapter: this, locale }),
    collection: Model.collection,
    limit,
    page,
    pagination,
    projection,
    query,
    queryAggregation,
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
