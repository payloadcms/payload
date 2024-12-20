import type { PipelineStage } from 'mongoose'
import type { CountVersions } from 'payload'

import type { MongooseAdapter } from './index.js'

import { countDocuments } from './utilities/countDocuments.js'
import { getCollation } from './utilities/getCollation.js'
import { getHasNearConstraint } from './utilities/getHasNearConstraint.js'
import { getSession } from './utilities/getSession.js'

export const countVersions: CountVersions = async function countVersions(
  this: MongooseAdapter,
  { collection, locale, req, where },
) {
  const Model = this.versions[collection]
  const session = await getSession(this, req)

  const hasNearConstraint = getHasNearConstraint(where)

  const queryAggregation: PipelineStage[] = []

  const query = await Model.buildQuery({
    aggregation: queryAggregation,
    locale,
    payload: this.payload,
    session,
    where,
  })

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0

  return {
    totalDocs: await countDocuments({
      adapter: this,
      collation: getCollation({ adapter: this, locale }),
      collection: Model.collection,
      query,
      queryAggregation,
      session,
      useEstimatedCount,
    }),
  }
}
