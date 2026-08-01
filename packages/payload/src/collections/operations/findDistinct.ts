import httpStatus from 'http-status'
import { z } from 'zod'

import type { AccessResult } from '../../config/types.js'
import type { PaginatedDistinctDocs } from '../../database/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, PopulateType, Sort, Where } from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type { Collection } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/APIError.js'
import { Forbidden } from '../../errors/Forbidden.js'
import { relationshipPopulationPromise } from '../../fields/hooks/afterRead/relationshipPopulationPromise.js'
import { createLocalReq } from '../../index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import {
  collectionSchema,
  depthSchema,
  localeSchema,
  operationWhereSchema,
  paginatedInput,
  populateSchema,
  sortSchema,
} from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { getFieldByPath } from '../../utilities/getFieldByPath.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

type FindDistinctValuesArgs = {
  collection: Collection
  depth?: number
  disableErrors?: boolean
  field: string
  limit?: number
  locale?: string
  overrideAccess?: boolean
  page?: number
  populate?: PopulateType
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: Sort
  trash?: boolean
  where?: Where
}
export const findDistinctValues = async (
  incomingArgs: FindDistinctValuesArgs,
): Promise<PaginatedDistinctDocs<Record<string, unknown>>> => {
  let args = incomingArgs

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'readDistinct',
      overrideAccess: args.overrideAccess!,
    })

    const {
      collection: { config: collectionConfig },
      disableErrors,
      overrideAccess,
      populate,
      showHiddenFields = false,
      trash = false,
      where,
    } = args

    const req = args.req!
    const { locale, payload } = req

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ disableErrors, req }, collectionConfig.access.read)

      // If errors are disabled, and access returns false, return empty results
      if (accessResult === false) {
        return {
          hasNextPage: false,
          hasPrevPage: false,
          limit: args.limit || 0,
          nextPage: null,
          page: 1,
          pagingCounter: 1,
          prevPage: null,
          totalDocs: 0,
          totalPages: 0,
          values: [],
        }
      }
    }

    // /////////////////////////////////////
    // Find Distinct
    // /////////////////////////////////////

    let fullWhere = combineQueries(where!, accessResult!)
    sanitizeWhereQuery({ fields: collectionConfig.flattenedFields, payload, where: fullWhere })

    // Exclude trashed documents when trash: false
    fullWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req,
      where: where ?? {},
    })

    const fieldResult = getFieldByPath({
      config: payload.config,
      fields: collectionConfig.flattenedFields,
      includeRelationships: true,
      path: args.field,
    })

    if (!fieldResult) {
      throw new APIError(
        `Field ${args.field} was not found in the collection ${collectionConfig.slug}`,
        httpStatus.BAD_REQUEST,
      )
    }

    if (fieldResult.field.hidden && !showHiddenFields) {
      throw new Forbidden(req.t)
    }

    if (fieldResult.field.access?.read) {
      const hasAccess = await fieldResult.field.access.read({
        collection: collectionConfig,
        req,
      })
      if (!hasAccess) {
        throw new Forbidden(req.t)
      }
    }

    if ('virtual' in fieldResult.field && fieldResult.field.virtual) {
      if (typeof fieldResult.field.virtual !== 'string') {
        throw new APIError(
          `Cannot findDistinct by a virtual field that isn't linked to a relationship field.`,
        )
      }

      let relationPath: string = ''
      let currentFields: FlattenedField[] = collectionConfig.flattenedFields
      const fieldPathSegments = fieldResult.field.virtual.split('.')
      for (const segment of fieldResult.field.virtual.split('.')) {
        relationPath = `${relationPath}${segment}`
        fieldPathSegments.shift()
        const field = currentFields.find((e) => e.name === segment)!
        if (
          (field.type === 'relationship' || field.type === 'upload') &&
          typeof field.relationTo === 'string'
        ) {
          break
        }
        if ('flattenedFields' in field) {
          currentFields = field.flattenedFields
        }
      }

      const path = `${relationPath}.${fieldPathSegments.join('.')}`

      const result = await payload.findDistinct({
        collection: collectionConfig.slug,
        depth: args.depth,
        disableErrors,
        field: path,
        limit: args.limit,
        locale,
        overrideAccess,
        page: args.page,
        populate,
        req,
        showHiddenFields,
        sort: args.sort,
        trash,
        where,
      })

      for (const val of result.values) {
        val[args.field] = val[path]
        delete val[path]
      }

      return result
    }

    let result = await payload.db.findDistinct({
      collection: collectionConfig.slug,
      field: args.field,
      limit: args.limit,
      locale: locale!,
      page: args.page,
      req,
      sort: args.sort,
      where: fullWhere,
    })

    if (
      (fieldResult.field.type === 'relationship' || fieldResult.field.type === 'upload') &&
      args.depth
    ) {
      const populationPromises: Promise<void>[] = []
      const sanitizedField = { ...fieldResult.field }
      if (fieldResult.field.hasMany) {
        sanitizedField.hasMany = false
      }
      for (const doc of result.values) {
        populationPromises.push(
          relationshipPopulationPromise({
            currentDepth: 0,
            depth: args.depth,
            draft: false,
            fallbackLocale: req.fallbackLocale || null,
            field: sanitizedField,
            locale: req.locale || null,
            overrideAccess: args.overrideAccess ?? true,
            parentIsLocalized: false,
            populate,
            req,
            showHiddenFields: false,
            siblingDoc: doc,
          }),
        )
      }
      await Promise.all(populationPromises)
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'findDistinct',
      overrideAccess,
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result
  } catch (error: unknown) {
    await killTransaction(args.req!)
    throw error
  }
}

type FindDistinctLocalMethod = <
  TSlug extends CollectionSlug,
  TField extends keyof DataFromCollectionSlug<TSlug> & string,
>(
  options: LocalAPIOptions<FindDistinctOptions<TSlug, TField>>,
) => Promise<PaginatedDistinctDocs<Record<TField, DataFromCollectionSlug<TSlug>[TField]>>>

const findDistinctSchema = z.looseObject({
  collection: collectionSchema,
  depth: depthSchema,
  field: z.string().min(1).describe('The field path whose distinct values should be returned'),
  limit: paginatedInput.limit,
  locale: localeSchema,
  page: paginatedInput.page,
  populate: populateSchema,
  showHiddenFields: z.boolean().optional(),
  sort: sortSchema,
  trash: z.boolean().describe('Include soft-deleted documents').optional(),
  where: operationWhereSchema.optional(),
})

export const findDistinctLocalAPI = defineLocalAPI<FindDistinctLocalMethod>()({
  name: 'findDistinct',
})

export const findDistinct = defineOperation({
  action: 'findDistinct',
  expose: {
    local: findDistinctLocalAPI,
    mcp: { name: 'findDistinct' },
  },
  handler: async <
    TSlug extends CollectionSlug,
    TField extends keyof DataFromCollectionSlug<TSlug> & string,
  >(
    payload: Payload,
    options: FindDistinctOptions<TSlug, TField>,
  ): Promise<PaginatedDistinctDocs<Record<TField, DataFromCollectionSlug<TSlug>[TField]>>> => {
    const {
      collection: collectionSlug,
      depth = 0,
      disableErrors,
      field,
      limit,
      overrideAccess = true,
      page,
      populate,
      showHiddenFields,
      sort,
      trash = false,
      where,
    } = options
    const collection = payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError(
        `The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`,
      )
    }

    return findDistinctValues({
      collection,
      depth,
      disableErrors,
      field,
      limit,
      overrideAccess,
      page,
      populate,
      req: await createLocalReq(options as CreateLocalReqOptions, payload),
      showHiddenFields,
      sort,
      trash,
      where,
    }) as Promise<PaginatedDistinctDocs<Record<TField, DataFromCollectionSlug<TSlug>[TField]>>>
  },
  input: findDistinctSchema,
  target: 'collection',
})

export type FindDistinctOptions<
  TSlug extends CollectionSlug,
  TField extends keyof DataFromCollectionSlug<TSlug>,
> = {
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
   * which can be read by hooks. Useful if you want to pass additional information to the hooks which
   * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
   * to determine if it should run or not.
   */
  context?: RequestContext
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * When set to `true`, errors will not be thrown.
   */
  disableErrors?: boolean
  /**
   * The field to get distinct values for
   */
  field: ({} & string) | TField
  /**
   * The maximum distinct field values to be returned.
   * By default the operation returns all the values.
   */
  limit?: number
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: 'all' | TypedLocale
  /**
   * Skip access control.
   * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
   * @default true
   */
  overrideAccess?: boolean
  /**
   * Get a specific page number (if limit is specified)
   * @default 1
   */
  page?: number
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType
  /**
   * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
   * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
   */
  req?: Partial<PayloadRequest>
  /**
   * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
   * @default false
   */
  showHiddenFields?: boolean
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-createdAt' // Sort DESC by createdAt
   * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  /**
   * When set to `true`, the query will include both normal and trashed documents.
   * To query only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
   * By default (`false`), the query will only include normal documents and exclude those with a `deletedAt` field.
   *
   * This argument has no effect unless `trash` is enabled on the collection.
   * @default false
   */
  trash?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
}
