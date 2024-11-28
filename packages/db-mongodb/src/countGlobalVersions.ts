import type { CountOptions } from 'mongodb'
import type { CountGlobalVersions, PayloadRequest } from 'payload'

import { flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'

export const countGlobalVersions: CountGlobalVersions = async function countGlobalVersions(
  this: MongooseAdapter,
  { global, locale, req = {} as PayloadRequest, where },
) {
  const Model = this.versions[global]
  const session = await getSession(this, req)

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

  let result: number
  if (useEstimatedCount) {
    result = await Model.collection.estimatedDocumentCount({ session })
  } else {
    const options: CountOptions = { session }

    if (Object.keys(query).length === 0 && this.disableIndexHints !== true) {
      // Improve the performance of the countDocuments query which is used if useEstimatedCount is set to false by adding
      // a hint. By default, if no hint is provided, MongoDB does not use an indexed field to count the returned documents,
      // which makes queries very slow. This only happens when no query (filter) is provided. If one is provided, it uses
      // the correct indexed field
      options.hint = {
        _id: 1,
      }
    }

    result = await Model.collection.countDocuments(query, options)
  }

  return {
    totalDocs: result,
  }
}
