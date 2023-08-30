import type { PaginateOptions } from 'mongoose'
import type { FindGlobalVersions } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { flattenWhereToOperators } from 'payload/database'
import { buildVersionGlobalFields } from 'payload/versions'

import type { MongooseAdapter } from './index.js'

import { buildSortParam } from './queries/buildSortParam.js'
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: MongooseAdapter,
  {
    global,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequest,
    skip,
    sort: sortArg,
    where,
  },
) {
  const Model = this.versions[global]
  const versionFields = buildVersionGlobalFields(
    this.payload.globals.config.find(({ slug }) => slug === global),
  )
  const options = {
    ...withSession(this, req.transactionID),
    limit,
    skip,
  }

  let hasNearConstraint = false

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  let sort
  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields: versionFields,
      locale,
      sort: sortArg || '-updatedAt',
      timestamps: true,
    })
  }

  const query = await Model.buildQuery({
    globalSlug: global,
    locale,
    payload: this.payload,
    where,
  })

  const paginationOptions: PaginateOptions = {
    forceCountFn: hasNearConstraint,
    lean: true,
    leanWithId: true,
    offset: skip,
    options,
    page,
    pagination,
    sort,
    useEstimatedCount: hasNearConstraint,
  }

  if (limit > 0) {
    paginationOptions.limit = limit
    // limit must also be set here, it's ignored when pagination is false
    paginationOptions.options.limit = limit
  }

  const result = await Model.paginate(query, paginationOptions)
  const docs = JSON.parse(JSON.stringify(result.docs))

  return {
    ...result,
    docs: docs.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc.id = doc._id
      return sanitizeInternalFields(doc)
    }),
  }
}
