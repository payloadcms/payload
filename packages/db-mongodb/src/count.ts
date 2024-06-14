import type { QueryOptions } from 'mongoose'
import type { Count, PayloadRequestWithData } from 'payload'

import { flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { withSession } from './withSession.js'

export const count: Count = async function count(
  this: MongooseAdapter,
  { collection, locale, req = {} as PayloadRequestWithData, where },
) {
  const Model = this.collections[collection]
  const options: QueryOptions = withSession(this, req.transactionID)

  let hasNearConstraint = false

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0

  if (!useEstimatedCount && Object.keys(query).length === 0 && this.disableIndexHints !== true) {
    // Improve the performance of the countDocuments query which is used if useEstimatedCount is set to false by adding
    // a hint. By default, if no hint is provided, MongoDB does not use an indexed field to count the returned documents,
    // which makes queries very slow. This only happens when no query (filter) is provided. If one is provided, it uses
    // the correct indexed field
    options.hint = {
      _id: 1,
    }
  }

  const result = await Model.countDocuments(query, options)

  return {
    totalDocs: result,
  }
}
