import { z } from 'zod'

import type { AccessResult } from '../../config/types.js'
import type { PaginatedDocs } from '../../database/types.js'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, PopulateType, SelectType, Sort, Where } from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { Collection, DraftFlagFromCollectionSlug } from '../config/types.js'
import type { FindOptions } from './find.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { collectionInput, paginatedInput } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

type FindDocumentVersionsArgs = {
  collection: Collection
  depth?: number
  limit?: number
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: Sort
  trash?: boolean
  where?: Where
} & Pick<FindOptions<string, SelectType>, 'select'>

export const findDocumentVersions = async <TData extends TypeWithVersion<TData>>(
  args: FindDocumentVersionsArgs,
): Promise<PaginatedDocs<TData>> => {
  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'findVersions',
      overrideAccess: args.overrideAccess!,
    })

    const {
      collection: { config: collectionConfig },
      depth,
      limit,
      overrideAccess,
      page,
      pagination = true,
      populate,
      select: incomingSelect,
      showHiddenFields,
      sort,
      trash = false,
      where,
    } = args

    const req = args.req!
    const { fallbackLocale, locale, payload } = req

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResults!: AccessResult

    if (!overrideAccess) {
      accessResults = await executeAccess({ req }, collectionConfig.access.readVersions)
    }

    const versionFields = buildVersionCollectionFields(payload.config, collectionConfig, true)

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req,
      versionFields,
      where: where!,
    })

    let fullWhere = combineQueries(where!, accessResults)

    // Exclude trashed documents when trash: false
    fullWhere = appendNonTrashedFilter({
      deletedAtPath: 'version.deletedAt',
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    sanitizeWhereQuery({ fields: versionFields, payload, where: fullWhere })

    const select = sanitizeSelect({
      fields: versionFields,
      select: resolveSelect({
        config: collectionConfig.select,
        operation: 'read',
        req,
        select: incomingSelect,
      }),
      versions: true,
    })

    // /////////////////////////////////////
    // Find
    // /////////////////////////////////////

    const usePagination = pagination && limit !== 0
    const sanitizedLimit = limit ?? (usePagination ? 10 : 0)
    const sanitizedPage = page || 1

    const paginatedDocs = await payload.db.findVersions<TData>({
      collection: collectionConfig.slug,
      limit: sanitizedLimit,
      locale: locale!,
      page: sanitizedPage,
      pagination,
      req,
      select,
      sort,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////
    let result: PaginatedDocs<TData> = paginatedDocs as unknown as PaginatedDocs<TData>
    result.docs = (await Promise.all(
      paginatedDocs.docs.map(async (doc) => {
        const docRef = doc
        // Fallback if not selected
        if (!docRef.version) {
          ;(docRef as any).version = {}
        }

        if (collectionConfig.hooks?.beforeRead?.length) {
          for (const hook of collectionConfig.hooks.beforeRead) {
            docRef.version =
              (await hook({
                collection: collectionConfig,
                context: req.context,
                doc: docRef.version,
                overrideAccess,
                query: fullWhere,
                req,
              })) || docRef.version
          }
        }

        return docRef
      }),
    )) as TData[]
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result.docs = await Promise.all(
      result.docs.map(async (data) => {
        data.version = await afterRead({
          collection: collectionConfig,
          context: req.context,
          depth: depth!,
          doc: data.version,
          // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
          draft: undefined,
          fallbackLocale: fallbackLocale!,
          findMany: true,
          global: null,
          locale: locale!,
          overrideAccess: overrideAccess!,
          populate,
          req,
          select: typeof select?.version === 'object' ? select.version : undefined,
          showHiddenFields: showHiddenFields!,
        })
        return data
      }),
    )

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks.afterRead?.length) {
      result.docs = await Promise.all(
        result.docs.map(async (doc) => {
          const docRef = doc

          for (const hook of collectionConfig.hooks.afterRead) {
            docRef.version =
              (await hook({
                collection: collectionConfig,
                context: req.context,
                doc: doc.version,
                findMany: true,
                overrideAccess,
                query: fullWhere,
                req,
              })) || doc.version
          }

          return docRef
        }),
      )
    }

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    result.docs = result.docs.map((doc) => sanitizeInternalFields<TData>(doc))

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'findVersions',
      overrideAccess,
      result,
    })

    return result
  } catch (error: unknown) {
    await killTransaction(args.req!)
    throw error
  }
}

type FindVersionsLocalMethod = <TSlug extends CollectionSlug>(
  options: LocalAPIOptions<FindVersionsOptions<TSlug>>,
) => Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<TSlug>>>>

const findVersionsSchema = z.looseObject({
  ...collectionInput,
  ...paginatedInput,
  showHiddenFields: z.boolean().optional(),
  trash: z.boolean().describe('Include versions of soft-deleted documents').optional(),
})

export const findVersionsLocalAPI = defineLocalAPI<FindVersionsLocalMethod>()({
  name: 'findVersions',
})

export const findVersions = defineOperation({
  action: 'findVersions',
  expose: {
    local: findVersionsLocalAPI,
    mcp: { name: 'findVersions' },
    rest: [
      {
        method: 'get',
        path: '/versions',
      },
    ],
  },
  handler: async <TSlug extends CollectionSlug>(
    payload: Payload,
    options: FindVersionsOptions<TSlug>,
  ): Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<TSlug>>>> => {
    const {
      collection: collectionSlug,
      depth,
      limit,
      overrideAccess = true,
      page,
      pagination = true,
      populate,
      select,
      showHiddenFields,
      sort,
      trash = false,
      where,
    } = options

    const collection = payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError(
        `The collection with slug ${String(collectionSlug)} can't be found. Find Versions Operation.`,
      )
    }

    return findDocumentVersions({
      collection,
      depth,
      limit,
      overrideAccess,
      page,
      pagination,
      populate,
      req: await createLocalReq(options as CreateLocalReqOptions, payload),
      select,
      showHiddenFields,
      sort,
      trash,
      where,
    })
  },
  input: findVersionsSchema,
  target: 'collection',
})

type FindVersionsOptionsBase<TSlug extends CollectionSlug> = {
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
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * The maximum related documents to be returned.
   * Defaults unless `defaultLimit` is specified for the collection config
   * @default 10
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
   * Get a specific page number
   * @default 1
   */
  page?: number
  /**
   * Set to `false` to return all documents and avoid querying for document counts which introduces some overhead.
   * You can also combine that property with a specified `limit` to limit documents but avoid the count query.
   */
  pagination?: boolean
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
   * @example '-version.createdAt' // Sort DESC by createdAt
   * @example ['version.group', '-version.createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  /**
   * When set to `true`, the query will include both normal and trashed (soft-deleted) documents.
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
} & Pick<FindOptions<TSlug, SelectType>, 'select'>

export type FindVersionsOptions<TSlug extends CollectionSlug> = DraftFlagFromCollectionSlug<TSlug> &
  FindVersionsOptionsBase<TSlug>
