import type { PaginateOptions, PipelineStage } from 'mongoose'
import type { Find, PayloadRequest } from 'payload'

import { flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildSortParam } from './queries/buildSortParam.js'
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const find: Find = async function find(
  this: MongooseAdapter,
  {
    collection,
    joins = {},
    limit,
    locale,
    page,
    pagination,
    projection,
    req = {} as PayloadRequest,
    sort: sortArg,
    where,
  },
) {
  const Model = this.collections[collection]
  const collectionConfig = this.payload.collections[collection].config
  const options = await withSession(this, req)

  let hasNearConstraint = false

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  let sort
  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields: collectionConfig.fields,
      locale,
      sort: sortArg || collectionConfig.defaultSort,
      timestamps: true,
    })
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0
  const paginationOptions: PaginateOptions = {
    forceCountFn: hasNearConstraint,
    lean: true,
    leanWithId: true,
    options,
    page,
    pagination,
    projection,
    sort,
    useEstimatedCount,
  }

  if (this.collation) {
    const defaultLocale = 'en'
    paginationOptions.collation = {
      locale: locale && locale !== 'all' && locale !== '*' ? locale : defaultLocale,
      ...this.collation,
    }
  }

  if (!useEstimatedCount && Object.keys(query).length === 0 && this.disableIndexHints !== true) {
    // Improve the performance of the countDocuments query which is used if useEstimatedCount is set to false by adding
    // a hint. By default, if no hint is provided, MongoDB does not use an indexed field to count the returned documents,
    // which makes queries very slow. This only happens when no query (filter) is provided. If one is provided, it uses
    // the correct indexed field
    paginationOptions.useCustomCountFn = () => {
      return Promise.resolve(
        Model.countDocuments(query, {
          ...options,
          hint: { _id: 1 },
        }),
      )
    }
  }

  if (limit >= 0) {
    paginationOptions.limit = limit
    // limit must also be set here, it's ignored when pagination is false
    paginationOptions.options.limit = limit

    // Disable pagination if limit is 0
    if (limit === 0) {
      paginationOptions.pagination = false
    }
  }

  let result

  if (Object.keys(collectionConfig.joins).length > 0 && joins !== false) {
    const joinConfig = this.payload.collections[collection].config.joins
    const aggregate: PipelineStage[] = [{ $match: query }]
    // Do some aggregation here

    Object.keys(joinConfig).forEach((slug) => {
      joinConfig[slug].forEach((join) => {
        // get the query options for the join off of req
        // if (joins[join.schemaPath] === false || req.query[join.schemaPath] === 'false') {
        //   continue
        // }

        const { limit, page, pagination = true, sort } = joins[join.schemaPath] || {}

        // skip if joins doesn't have the schemaPath !== false

        // add lookup to join the doc ids and localize the key as needed
        // if locale all, do every locale

        // $lookup
        // from: collection
        // localField: _id
        // foreignField: on (localized)
        // as collection

        if (this.payload.config.localization && locale === 'all') {
          this.payload.config.localization.localeCodes.forEach((code) => {
            aggregate.push({
              $lookup: {
                as: `${join.schemaPath}.${code}`,
                foreignField: `${join.field.on}.${code}`,
                from: slug,
                localField: '_id',
              },
              // $count to count the docs
            })
          })
          // $count to count the docs
          // $slice to limit the docs
        } else {
          const localeSuffix =
            join.field.localized && this.payload.config.localization && locale ? `.${locale}` : ''
          const as = `${join.schemaPath}${localeSuffix}`
          const asAlias = `${join.schemaPath}${localeSuffix}`.replaceAll('.', '_')
          aggregate.push({
            $lookup: {
              as,
              foreignField: `${join.field.on}${localeSuffix}`,
              from: slug,
              localField: '_id',
            },
          })
          aggregate.push({
            $addFields: {
              [asAlias]: as,
            },
          })
          aggregate.push({
            $unwind: `$${asAlias}`,
          })
          aggregate.push({
            $group: {
              _id: '$_id',
              [asAlias]: { $push: `$${as}._id` },
            },
          })
          aggregate.push({
            $addFields: {
              [as]: asAlias,
            },
          })
          // $count to count the docs
          // $slice to limit the docs
        }
      })
    })

    result = await Model.aggregatePaginate(Model.aggregate(aggregate), paginationOptions)
  } else {
    result = await Model.paginate(query, paginationOptions)
  }

  // const joinPromises = []

  // result.docs.forEach((doc) => {
  //   joinPromises.push(
  //     setJoins({
  //       collection,
  //       doc,
  //       joins,
  //       payload: this.payload,
  //       req,
  //     }),
  //   )
  // })

  // await Promise.all(joinPromises)

  const docs = JSON.parse(JSON.stringify(result.docs))

  return {
    ...result,
    docs: docs.map((doc) => {
      doc.id = doc._id
      return sanitizeInternalFields(doc)
    }),
  }
}
