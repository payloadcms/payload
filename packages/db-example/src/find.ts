import type { PaginateOptions } from 'mongoose'
import type { Find } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { flattenWhereToOperators } from 'payload/database'

import type { ExampleAdapter } from '.'

import { buildSortParam } from './queries/buildSortParam'

export const find: Find = async function find(
  this: ExampleAdapter,
  { collection, limit, locale, page, pagination, req = {} as PayloadRequest, sort: sortArg, where },
) {
  // Need to handle the above arguments and pass them to your database adapter

  /**
   * Implement the logic to get the adapterSpecificModel from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.collections[collection]
   * ```
   */
  let adapterSpecificModel

  const collectionConfig = this.payload.collections[collection].config

  // Replace this with your session handling or remove if not needed
  const options = {}

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

  /**
   * Implement the query building logic according to your database syntax.
   *
   * @example
   * ```ts
   * const query = {} // Build your query here
   * ```
   */
  const query = {}

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0
  const paginationOptions: PaginateOptions = {
    forceCountFn: hasNearConstraint,
    lean: true,
    leanWithId: true,
    options,
    page,
    pagination,
    sort,
    useEstimatedCount,
  }

  if (!useEstimatedCount && Object.keys(query).length === 0 && this.disableIndexHints !== true) {
    // Improve the performance of the countDocuments query which is used if useEstimatedCount is set to false by adding
    // a hint. By default, if no hint is provided, MongoDB does not use an indexed field to count the returned documents,
    // which makes queries very slow. This only happens when no query (filter) is provided. If one is provided, it uses
    // the correct indexed field
    paginationOptions.useCustomCountFn = () => {
      return Promise.resolve(
        adapterSpecificModel.countDocuments(query, {
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

  /**
   * Implement the logic to paginate the query results according to your database's methods.
   *
   * @example
   * ```ts
   * const result = await adapterSpecificModel.paginate(query, paginationOptions)
   * ```
   */
  const result = await adapterSpecificModel.paginate(query, paginationOptions)

  const docs = JSON.parse(JSON.stringify(result.docs))

  return {
    ...result,
    docs: docs.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc.id = doc._id // Adjust this line according to your database's ID field
      /**
       * If needed, implement logic to sanitize internal fields of the document.
       * This might be necessary to remove any database-specific metadata.
       *
       * @example
       * ```ts
       * doc = sanitizeInternalFields(doc)
       * ```
       */
      return doc
    }),
  }
}
