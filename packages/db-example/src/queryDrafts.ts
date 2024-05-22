import type { PaginateOptions } from 'mongoose'
import type { QueryDrafts } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { combineQueries, flattenWhereToOperators } from 'payload/database'

import type { ExampleAdapter } from '.'

import { buildSortParam } from './queries/buildSortParam'

export const queryDrafts: QueryDrafts = async function queryDrafts(
  this: ExampleAdapter,
  { collection, limit, locale, page, pagination, req = {} as PayloadRequest, sort: sortArg, where },
) {
  /**
   * Implement the logic to get the adapterSpecificModel for versions from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.versions[collection]
   * ```
   */
  let adapterSpecificModel

  const collectionConfig = this.payload.collections[collection].config

  // Replace this with your session handling or remove if not needed
  const options = {}

  let hasNearConstraint
  let sort

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields: collectionConfig.fields,
      locale,
      sort: sortArg || collectionConfig.defaultSort,
      timestamps: true,
    })
  }

  const combinedWhere = combineQueries({ latest: { equals: true } }, where)

  /**
   * Implement the query building logic according to your database syntax.
   *
   * @example
   * ```ts
   * const versionQuery = {} // Build your query here
   * ```
   */
  const versionQuery = {}

  // Use estimated count if applicable
  const useEstimatedCount =
    hasNearConstraint || !versionQuery || Object.keys(versionQuery).length === 0
  const paginationOptions: PaginateOptions = {
    // Add your pagination options here
    forceCountFn: hasNearConstraint,
    lean: true,
    leanWithId: true,
    options,
    page,
    pagination,
    sort,
    useEstimatedCount,
  }

  if (
    !useEstimatedCount &&
    Object.keys(versionQuery).length === 0 &&
    this.disableIndexHints !== true
  ) {
    /**
     * Add custom count function if needed.
     *
     * @example
     * ```ts
     * paginationOptions.useCustomCountFn = () => {
     *   return Promise.resolve(
     *     adapterSpecificModel.countDocuments(versionQuery, {
     *       hint: { _id: 1 }, // Replace with your database's specific hint logic if needed
     *     }),
     *   )
     * }
     * ```
     */
    paginationOptions.useCustomCountFn = () => {
      return Promise.resolve(
        adapterSpecificModel.countDocuments(versionQuery, {
          hint: { _id: 1 }, // Replace with your database's specific hint logic if needed
        }),
      )
    }
  }

  if (limit > 0) {
    paginationOptions.limit = limit
    // limit must also be set here, it's ignored when pagination is false
    paginationOptions.options.limit = limit
  }

  /**
   * Implement the logic to paginate the query results according to your database's methods.
   *
   * @example
   * ```ts
   * const result = await adapterSpecificModel.paginate(versionQuery, paginationOptions)
   * ```
   */
  const result = await adapterSpecificModel.paginate(versionQuery, paginationOptions)
  const docs = JSON.parse(JSON.stringify(result.docs))

  return {
    ...result,
    docs: docs.map((doc) => {
      // Adjust this line according to your database's ID field and data structure
      doc = {
        _id: doc.parent,
        id: doc.parent,
        ...doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }

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
