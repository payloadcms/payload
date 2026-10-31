import type { CountOptions } from 'mongodb'
import type { Count } from 'payload'

import {
  flattenWhereToOperators,
  resolveBranchQuery,
  resolveBranchReadState,
  rewriteBranchIDs,
} from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildBranchVisibilityStages } from './queries/buildBranchVisibility.js'
import { buildQuery } from './queries/buildQuery.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'

export const count: Count = async function count(
  this: MongooseAdapter,
  { branch, collection: collectionSlug, locale, req, where = {} },
) {
  const { collectionConfig, Model } = getCollection({ adapter: this, collectionSlug })
  const branchReadState = resolveBranchReadState({ branch, collectionSlug, req })

  where = branchReadState.useBranching
    ? (rewriteBranchIDs(where) ?? {})
    : ((await resolveBranchQuery({ branch, collectionSlug, req, where })) ?? {})
  const branchVisibility = branchReadState.useBranching
    ? buildBranchVisibilityStages({
        adapter: this,
        branch: branchReadState.branch,
        collectionSlug,
      })
    : []

  let hasNearConstraint = false

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  const query = await buildQuery({
    adapter: this,
    branch,
    collectionSlug,
    fields: collectionConfig.flattenedFields,
    locale,
    req,
    where,
  })

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount =
    !branchVisibility.length && (hasNearConstraint || !query || Object.keys(query).length === 0)

  const options: CountOptions = {
    session: await getSession(this, req),
  }

  if (this.collation) {
    const localizationConfig = this.payload.config.localization
    const defaultLocale =
      (typeof localizationConfig === 'object' && localizationConfig?.defaultLocale) || 'en'

    options.collation = {
      locale: locale && locale !== 'all' && locale !== '*' ? locale : defaultLocale,
      ...this.collation,
    }
  }

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
  if (branchVisibility.length) {
    result = await Model.aggregate(
      [{ $match: query }, ...branchVisibility, { $count: 'count' }],
      options,
    ).then((rows) => rows[0]?.count ?? 0)
  } else if (useEstimatedCount) {
    result = await Model.estimatedDocumentCount({ session: options.session })
  } else {
    result = await Model.countDocuments(query, options)
  }

  return {
    totalDocs: result,
  }
}
