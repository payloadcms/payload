import type { AggregateOptions, QueryOptions } from 'mongoose'

import {
  applyBranchIDProjection,
  type FindOne,
  resolveBranchQuery,
  resolveBranchReadState,
  rewriteBranchIDs,
  withBranchIDSelect,
} from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildBranchVisibilityStages } from './queries/buildBranchVisibility.js'
import { buildQuery } from './queries/buildQuery.js'
import { aggregatePaginate } from './utilities/aggregatePaginate.js'
import { buildJoinAggregation } from './utilities/buildJoinAggregation.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { resolveJoins } from './utilities/resolveJoins.js'
import { transform } from './utilities/transform.js'

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { branch, collection: collectionSlug, draftsEnabled, joins, locale, req, select, where = {} },
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

  const query = await buildQuery({
    adapter: this,
    branch,
    collectionSlug,
    fields: collectionConfig.flattenedFields,
    locale,
    req,
    where,
  })

  const projection = buildProjectionFromSelect({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    select: withBranchIDSelect({ branch, collectionSlug, req, select }),
  })

  const aggregate = await buildJoinAggregation({
    adapter: this,
    branch,
    collection: collectionSlug,
    collectionConfig,
    draftsEnabled,
    joins,
    locale,
    projection,
    query,
    req,
  })

  const session = await getSession(this, req)
  const options: AggregateOptions & QueryOptions = {
    lean: true,
    session,
  }

  let doc
  if (aggregate.length > 0 || branchVisibility.length > 0) {
    const { docs } = await aggregatePaginate({
      adapter: this,
      branchVisibility,
      joinAggregation: aggregate,
      limit: 1,
      Model,
      pagination: false,
      projection,
      query,
      session,
    })
    doc = docs[0]
  } else {
    ;(options as Record<string, unknown>).projection = projection
    doc = await Model.findOne(query, {}, options)
  }

  if (doc && !this.useJoinAggregations) {
    await resolveJoins({
      adapter: this,
      branch,
      collectionSlug,
      docs: [doc] as Record<string, unknown>[],
      joins,
      locale,
      req,
    })
  }

  if (!doc) {
    return null
  }

  transform({ adapter: this, data: doc, fields: collectionConfig.fields, operation: 'read' })

  applyBranchIDProjection({
    branch,
    collectionSlug,
    docs: [doc as Record<string, unknown>],
    req,
  })

  return doc
}
