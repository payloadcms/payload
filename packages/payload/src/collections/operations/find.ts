import { z } from 'zod'

import type { AccessResult } from '../../config/types.js'
import type { PaginatedDocs } from '../../database/types.js'
import type {
  CollectionSlug,
  JoinQuery,
  Payload,
  FindOptions as PayloadFindOptions,
  PayloadTypes,
  RequestContext,
  TypedFallbackLocale,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type {
  DraftTransformCollectionWithSelect,
  PayloadRequest,
  PopulateType,
  SelectType,
  Sort,
  TransformCollectionWithSelect,
  Where,
} from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type {
  Collection,
  DataFromCollectionSlug,
  DraftFlagFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeJoinQuery } from '../../database/sanitizeJoinQuery.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { lockedDocumentsCollectionSlug } from '../../locked-documents/config.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { collectionInput, paginatedInput } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { getQueryDraftsSelect } from '../../versions/drafts/getQueryDraftsSelect.js'
import { getQueryDraftsSort } from '../../versions/drafts/getQueryDraftsSort.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'
import { sanitizeSortQuery } from './utilities/sanitizeSortQuery.js'

type FindDocumentsArgs = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  includeLockStatus?: boolean
  joins?: JoinQuery
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
} & Pick<PayloadFindOptions<string, SelectType>, 'select'>

const lockDurationDefault = 300 // Default 5 minutes in seconds

export const findDocuments = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: FindDocumentsArgs,
): Promise<PaginatedDocs<TransformCollectionWithSelect<TSlug, TSelect>>> => {
  let args = incomingArgs

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'read',
      overrideAccess: args.overrideAccess!,
    })

    const {
      collection: { config: collectionConfig },
      collection,
      currentDepth,
      depth,
      disableErrors,
      draft: draftsEnabled,
      includeLockStatus: includeLockStatusFromArgs,
      joins,
      limit,
      overrideAccess,
      page,
      pagination = true,
      populate,
      select: incomingSelect,
      showHiddenFields,
      sort: incomingSort,
      trash = false,
      where,
    } = args

    const req = args.req!

    const includeLockStatus =
      includeLockStatusFromArgs && req.payload.collections?.[lockedDocumentsCollectionSlug]

    const { fallbackLocale, locale, payload } = req

    const select = sanitizeSelect({
      fields: collectionConfig.flattenedFields,
      select: resolveSelect({
        config: collectionConfig.select,
        operation: 'read',
        req,
        select: incomingSelect,
      }),
    })

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ disableErrors, req }, collectionConfig.access.read)

      // If errors are disabled, and access returns false, return empty results
      if (accessResult === false) {
        return {
          docs: [],
          hasNextPage: false,
          hasPrevPage: false,
          limit: limit!,
          nextPage: null,
          page: 1,
          pagingCounter: 1,
          prevPage: null,
          totalDocs: 0,
          totalPages: 1,
        }
      }
    }

    // /////////////////////////////////////
    // Find
    // /////////////////////////////////////

    const usePagination = pagination && limit !== 0
    const sanitizedLimit = limit ?? (usePagination ? 10 : 0)
    const sanitizedPage = page || 1

    let result: PaginatedDocs<DataFromCollectionSlug<TSlug>>

    let fullWhere = combineQueries(where!, accessResult!)
    sanitizeWhereQuery({ fields: collectionConfig.flattenedFields, payload, where: fullWhere })

    // Exclude trashed documents when trash: false
    fullWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    const sort = sanitizeSortQuery({
      fields: collection.config.flattenedFields,
      sort: incomingSort,
    })

    const sanitizedJoins = await sanitizeJoinQuery({
      collectionConfig,
      joins,
      overrideAccess: overrideAccess!,
      req,
    })

    if (hasDraftsEnabled(collectionConfig) && draftsEnabled) {
      fullWhere = appendVersionToQueryKey(fullWhere)

      await validateQueryPaths({
        collectionConfig: collection.config,
        overrideAccess: overrideAccess!,
        req,
        versionFields: buildVersionCollectionFields(payload.config, collection.config, true),
        where: appendVersionToQueryKey(where),
      })

      result = await payload.db.queryDrafts<DataFromCollectionSlug<TSlug>>({
        collection: collectionConfig.slug,
        joins: req.payloadAPI === 'GraphQL' ? false : sanitizedJoins,
        limit: sanitizedLimit,
        locale: locale!,
        page: sanitizedPage,
        pagination: usePagination,
        req,
        select: getQueryDraftsSelect({ select }),
        sort: getQueryDraftsSort({
          collectionConfig,
          sort,
        }),
        where: fullWhere,
      })
    } else {
      await validateQueryPaths({
        collectionConfig,
        overrideAccess: overrideAccess!,
        req,
        where: where!,
      })

      result = await payload.db.find<DataFromCollectionSlug<TSlug>>({
        collection: collectionConfig.slug,
        draftsEnabled,
        joins: req.payloadAPI === 'GraphQL' ? false : sanitizedJoins,
        limit: sanitizedLimit,
        locale: locale!,
        page: sanitizedPage,
        pagination,
        req,
        select,
        sort,
        where: fullWhere,
      })
    }

    // /////////////////////////////////////
    // Add collection property for auth collections
    // /////////////////////////////////////

    if (collectionConfig.auth) {
      result.docs = result.docs.map((doc) => ({ ...doc, collection: collectionConfig.slug }))
    }

    if (includeLockStatus) {
      try {
        const lockDocumentsProp = collectionConfig?.lockDocuments

        const lockDuration =
          typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault
        const lockDurationInMilliseconds = lockDuration * 1000

        const now = new Date().getTime()

        const lockedDocuments = await payload.find({
          collection: lockedDocumentsCollectionSlug,
          depth: 1,
          limit: sanitizedLimit,
          overrideAccess: false,
          pagination: false,
          req,
          where: {
            and: [
              {
                'document.relationTo': {
                  equals: collectionConfig.slug,
                },
              },
              {
                'document.value': {
                  in: result.docs.map((doc) => doc.id),
                },
              },
              // Query where the lock is newer than the current time minus lock time
              {
                updatedAt: {
                  greater_than: new Date(now - lockDurationInMilliseconds),
                },
              },
            ],
          },
        })

        const lockedDocs = Array.isArray(lockedDocuments?.docs) ? lockedDocuments.docs : []

        // Filter out stale locks
        const validLockedDocs = lockedDocs.filter((lock) => {
          const lastEditedAt = new Date(lock?.updatedAt).getTime()
          return lastEditedAt + lockDurationInMilliseconds > now
        })

        for (const doc of result.docs) {
          const lockedDoc = validLockedDocs.find((lock) => lock?.document?.value === doc.id)
          doc._isLocked = !!lockedDoc
          doc._userEditing = lockedDoc ? lockedDoc?.user?.value : null
        }
      } catch (_err) {
        for (const doc of result.docs) {
          doc._isLocked = false
          doc._userEditing = null
        }
      }
    }

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    if (collectionConfig?.hooks?.beforeRead?.length) {
      result.docs = await Promise.all(
        result.docs.map(async (doc) => {
          let docRef = doc

          for (const hook of collectionConfig.hooks.beforeRead) {
            docRef =
              (await hook({
                collection: collectionConfig,
                context: req.context,
                doc: docRef,
                overrideAccess: overrideAccess!,
                query: fullWhere,
                req,
              })) || docRef
          }

          return docRef
        }),
      )
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result.docs = await Promise.all(
      result.docs.map(async (doc) =>
        afterRead<DataFromCollectionSlug<TSlug>>({
          collection: collectionConfig,
          context: req.context,
          currentDepth,
          depth: depth!,
          doc,
          draft: draftsEnabled!,
          fallbackLocale: fallbackLocale!,
          findMany: true,
          global: null,
          locale: locale!,
          overrideAccess: overrideAccess!,
          populate,
          req,
          select,
          showHiddenFields: showHiddenFields!,
        }),
      ),
    )

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    if (collectionConfig?.hooks?.afterRead?.length) {
      result.docs = await Promise.all(
        result.docs.map(async (doc) => {
          let docRef = doc

          for (const hook of collectionConfig.hooks.afterRead) {
            docRef =
              (await hook({
                collection: collectionConfig,
                context: req.context,
                doc: docRef,
                findMany: true,
                overrideAccess: overrideAccess!,
                query: fullWhere,
                req,
              })) || docRef
          }

          return docRef
        }),
      )
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'find',
      overrideAccess: overrideAccess!,
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result as PaginatedDocs<TransformCollectionWithSelect<TSlug, TSelect>>
  } catch (error: unknown) {
    await killTransaction(args.req!)
    throw error
  }
}

type FindLocalMethod = <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDraft extends boolean = false,
>(
  options: { draft?: TDraft } & LocalAPIOptions<FindOptions<TSlug, TSelect>>,
) => Promise<
  PaginatedDocs<
    TDraft extends true
      ? PayloadTypes extends { strictDraftTypes: true }
        ? DraftTransformCollectionWithSelect<TSlug, TSelect>
        : TransformCollectionWithSelect<TSlug, TSelect>
      : TransformCollectionWithSelect<TSlug, TSelect>
  >
>

const findSchema = z.looseObject({
  ...collectionInput,
  ...paginatedInput,
  draft: z.boolean().describe('Return the latest draft when available').optional(),
  joins: z
    .union([z.record(z.string(), z.unknown()), z.literal(false)])
    .describe('Optional: configure join field queries, or pass false to disable all join fields.')
    .optional(),
  trash: z.boolean().describe('Include soft-deleted documents').optional(),
})

export const findLocalAPI = defineLocalAPI<FindLocalMethod>()({ name: 'find' })

export const find = defineOperation({
  action: 'find',
  expose: {
    local: findLocalAPI,
    mcp: { name: 'findDocuments' },
    rest: [
      {
        method: 'get',
        path: '/',
      },
    ],
  },
  handler: async <
    TSlug extends CollectionSlug,
    TSelect extends SelectFromCollectionSlug<TSlug>,
    TDraft extends boolean = false,
  >(
    payload: Payload,
    options: { draft?: TDraft } & FindOptions<TSlug, TSelect>,
  ): Promise<
    PaginatedDocs<
      TDraft extends true
        ? PayloadTypes extends { strictDraftTypes: true }
          ? DraftTransformCollectionWithSelect<TSlug, TSelect>
          : TransformCollectionWithSelect<TSlug, TSelect>
        : TransformCollectionWithSelect<TSlug, TSelect>
    >
  > => {
    const {
      collection: collectionSlug,
      currentDepth,
      depth,
      disableErrors,
      draft = false,
      includeLockStatus,
      joins,
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
        `The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`,
      )
    }

    return findDocuments<TSlug, TSelect>({
      collection,
      currentDepth,
      depth,
      disableErrors,
      draft,
      includeLockStatus,
      joins,
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
  input: findSchema,
  target: 'collection',
})

type FindOptionsBase<TSlug extends CollectionSlug, TSelect extends SelectType> = {
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
   * The current population depth, used internally for relationships population.
   * @internal
   */
  currentDepth?: number
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * When set to `true`, errors will not be thrown.
   */
  disableErrors?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: TypedFallbackLocale
  /**
   * Include info about the lock status to the result into all documents with fields: `_isLocked` and `_userEditing`
   */
  includeLockStatus?: boolean
  /**
   * The [Join Field Query](https://payloadcms.com/docs/fields/join#query-options).
   * Pass `false` to disable all join fields from the result.
   */
  joins?: JoinQuery<TSlug>
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
   * By default, Payload's APIs will return all fields for a given collection or global.
   * But you may not need all of that data for all of your queries.
   * Sometimes, you might want just a few fields from the response.
   *
   * With the Select API, you can define exactly which fields you'd like to retrieve.
   * This can impact performance by reducing database load and response size.
   *
   *
   * **Example: Select specific fields**
   * ```ts
   * const post = await payload.findByID({
   *   collection: 'posts',
   *   id: '1',
   *   select: { title: true, content: true },
   * })
   *
   * console.log(post) // { id: '1', title: 'My Post', content: 'This is my post' }
   * ```
   *
   * **Example: Select all fields except `content`**
   *
   * ```ts
   * const post = await payload.findByID({
   *   collection: 'posts',
   *   id: '1',
   *   select: { content: false },
   * })
   *
   * console.log(post) // { id: '1', title: 'My Post', number: 3 }
   * ```
   *
   * **Example: Empty select returns only `id`**
   *
   * ```ts
   * const post = await payload.findByID({
   *   collection: 'posts',
   *   id: '1',
   *   select: {},
   * })
   *
   * console.log(post) // { id: '1' }
   * ```
   *
   * @see https://payloadcms.com/docs/queries/select
   */
  select?: TSelect
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

export type FindOptions<TSlug extends CollectionSlug, TSelect extends SelectType> = DraftFlagFromCollectionSlug<TSlug> &
  FindOptionsBase<
  TSlug,
  TSelect
>
