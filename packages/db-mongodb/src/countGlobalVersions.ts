import type { CountOptions } from 'mongodb'
import type { CountGlobalVersions } from 'payload'

import { buildVersionGlobalFields, flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'

export const countGlobalVersions: CountGlobalVersions = async function countGlobalVersions(
  this: MongooseAdapter,
  { global: globalSlug, locale, req, where = {} },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug, versions: true })

  const options: CountOptions = {
    session: await getSession(this, req),
  }

  let hasNearConstraint = false

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  const query = await buildQuery({
    adapter: this,
    fields: buildVersionGlobalFields(this.payload.config, globalConfig, true),
    locale,
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

  let result: number
  if (useEstimatedCount) {
    result = await Model.estimatedDocumentCount({ session: options.session })
  } else {
    result = await Model.countDocuments(query, options)
  }

  return {
    totalDocs: result,
  }
}
