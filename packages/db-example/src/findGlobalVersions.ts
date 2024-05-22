import type { PaginateOptions } from 'mongoose'
import type { FindGlobalVersions } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { flattenWhereToOperators } from 'payload/database'
import { buildVersionGlobalFields } from 'payload/versions'

import type { ExampleAdapter } from '.'

import { buildSortParam } from './queries/buildSortParam'

export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: ExampleAdapter,
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
  /**
   * Implement the logic to get the adapterSpecificModel for versions from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.versions[global]
   * ```
   */
  let adapterSpecificModel

  const versionFields = buildVersionGlobalFields(
    this.payload.globals.config.find(({ slug }) => slug === global),
  )

  // Replace this with your session handling or remove if not needed
  const options = {
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

  /**
   * Implement the query building logic according to your database syntax.
   *
   * @example
   * ```ts
   * const query = {} // Build your query here
   * ```
   */
  const query = {}

  // Use estimated count if applicable
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0
  const paginationOptions: PaginateOptions = {
    // Add your pagination options here
    forceCountFn: hasNearConstraint,
    lean: true,
    leanWithId: true,
    offset: skip,
    options,
    page,
    pagination,
    sort,
    useEstimatedCount,
  }

  if (!useEstimatedCount && Object.keys(query).length === 0 && this.disableIndexHints !== true) {
    /**
     * Add custom count function if needed.
     *
     * @example
     * ```ts
     * paginationOptions.useCustomCountFn = () => {
     *   return Promise.resolve(
     *     adapterSpecificModel.countDocuments(query, {
     *       ...options,
     *       hint: { _id: 1 }, // Replace with your database's specific hint logic if needed
     *     }),
     *   )
     * }
     * ```
     */
    paginationOptions.useCustomCountFn = () => {
      return Promise.resolve(
        adapterSpecificModel.countDocuments(query, {
          ...options,
          hint: { _id: 1 }, // Replace with your database's specific hint logic if needed
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
