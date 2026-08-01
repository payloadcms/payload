import { z } from 'zod'

import type { FindOneArgs } from '../../database/types.js'
import type {
  CollectionSlug,
  FindOptions,
  JoinQuery,
  Payload,
  RequestContext,
  TypedFallbackLocale,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type {
  ApplyDisableErrors,
  JsonObject,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type {
  Collection,
  DataFromCollectionSlug,
  DraftFlagFromCollectionSlug,
  SelectFromCollectionSlug,
  TypeWithID,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { sanitizeJoinQuery } from '../../database/sanitizeJoinQuery.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError, NotFound } from '../../errors/index.js'
import { afterRead, type AfterReadArgs } from '../../fields/hooks/afterRead/index.js'
import { validateQueryPaths } from '../../index.js'
import { lockedDocumentsCollectionSlug } from '../../locked-documents/config.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { collectionInput, idSchema } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { getSelectMode } from '../../utilities/getSelectMode.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { replaceWithDraftIfAvailable } from '../../versions/drafts/replaceWithDraftIfAvailable.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

type FindDocumentByIDArgs = {
  collection: Collection
  currentDepth?: number
  /**
   * You may pass the document data directly which will skip the `db.findOne` database query.
   * This is useful if you want to use this endpoint solely for running hooks and populating data.
   */
  data?: Record<string, unknown>
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  id: number | string
  includeLockStatus?: boolean
  joins?: JoinQuery
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
  trash?: boolean
} & Pick<AfterReadArgs<JsonObject>, 'flattenLocales'> &
  Pick<FindOptions<string, SelectType>, 'select'>

export const findDocumentByID = async <
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: FindDocumentByIDArgs,
): Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>> => {
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
      id,
      collection: { config: collectionConfig },
      currentDepth,
      depth,
      disableErrors,
      draft: replaceWithVersion = false,
      flattenLocales,
      includeLockStatus: includeLockStatusFromArgs,
      joins,
      overrideAccess = false,
      populate,
      req: { fallbackLocale, locale, t },
      req,
      select: incomingSelect,
      showHiddenFields,
      trash = false,
    } = args

    const includeLockStatus =
      includeLockStatusFromArgs && req.payload.collections?.[lockedDocumentsCollectionSlug]

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

    const accessResult = !overrideAccess
      ? await executeAccess({ id, disableErrors, req }, collectionConfig.access.read)
      : true

    // If errors are disabled, and access returns false, return null
    if (accessResult === false) {
      return null!
    }

    const where = { id: { equals: id } }

    let fullWhere = combineQueries(where, accessResult)

    // Exclude trashed documents when trash: false
    fullWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    sanitizeWhereQuery({
      fields: collectionConfig.flattenedFields,
      payload: args.req.payload,
      where: fullWhere,
    })

    const sanitizedJoins = await sanitizeJoinQuery({
      collectionConfig,
      joins,
      overrideAccess,
      req,
    })

    // execute only if there's a custom ID and potentially overwriten access on id
    if (req.payload.collections[collectionConfig.slug]!.customIDType) {
      await validateQueryPaths({
        collectionConfig,
        overrideAccess,
        req,
        where,
      })
    }

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    let dbSelect = select

    if (
      collectionConfig.versions?.drafts &&
      replaceWithVersion &&
      select &&
      getSelectMode(select) === 'include'
    ) {
      dbSelect = { ...select, createdAt: true, updatedAt: true }
    }

    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      draftsEnabled: replaceWithVersion,
      joins: req.payloadAPI === 'GraphQL' ? false : sanitizedJoins,
      locale: locale!,
      req: {
        transactionID: req.transactionID,
      } as PayloadRequest,
      select: dbSelect,
      where: fullWhere,
    }

    if (!findOneArgs.where?.and?.[0]?.id) {
      throw new NotFound(t)
    }

    const docWithLocales = await req.payload.db.findOne(findOneArgs)

    if (!docWithLocales && !args.data) {
      if (!disableErrors) {
        throw new NotFound(req.t)
      }
      return null!
    }

    let result: DataFromCollectionSlug<TSlug> =
      (args.data as DataFromCollectionSlug<TSlug>) ?? docWithLocales!

    // /////////////////////////////////////
    // Add collection property for auth collections
    // /////////////////////////////////////

    if (collectionConfig.auth) {
      result = { ...result, collection: collectionConfig.slug }
    }

    // /////////////////////////////////////
    // Include Lock Status if required
    // /////////////////////////////////////

    if (includeLockStatus && id) {
      let lockStatus: (JsonObject & TypeWithID) | null = null

      try {
        const lockDocumentsProp = collectionConfig?.lockDocuments

        const lockDurationDefault = 300 // Default 5 minutes in seconds
        const lockDuration =
          typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault
        const lockDurationInMilliseconds = lockDuration * 1000

        const lockedDocument = await req.payload.find({
          collection: lockedDocumentsCollectionSlug,
          depth: 1,
          limit: 1,
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
                  equals: id,
                },
              },
              // Query where the lock is newer than the current time minus lock time
              {
                updatedAt: {
                  greater_than: new Date(new Date().getTime() - lockDurationInMilliseconds),
                },
              },
            ],
          },
        })

        if (lockedDocument && lockedDocument.docs.length > 0) {
          lockStatus = lockedDocument.docs[0]!
        }
      } catch {
        // swallow error
      }

      result._isLocked = !!lockStatus
      result._userEditing = lockStatus?.user?.value ?? null
    }

    // /////////////////////////////////////
    // Replace document with draft if available
    // /////////////////////////////////////

    if (replaceWithVersion && hasDraftsEnabled(collectionConfig)) {
      result = await replaceWithDraftIfAvailable({
        accessResult,
        doc: result,
        entity: collectionConfig,
        entityType: 'collection',
        overrideAccess,
        req,
        select,
      })
    }

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeRead?.length) {
      for (const hook of collectionConfig.hooks.beforeRead) {
        result =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result,
            overrideAccess,
            query: findOneArgs.where,
            req,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: collectionConfig,
      context: req.context,
      currentDepth,
      depth: depth!,
      doc: result,
      draft: replaceWithVersion,
      fallbackLocale: fallbackLocale!,
      flattenLocales,
      global: null,
      locale: locale!,
      overrideAccess,
      populate,
      req,
      select,
      showHiddenFields: showHiddenFields!,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterRead?.length) {
      for (const hook of collectionConfig.hooks.afterRead) {
        result =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result,
            overrideAccess,
            query: findOneArgs.where,
            req,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'findByID',
      overrideAccess,
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result as ApplyDisableErrors<
      TransformCollectionWithSelect<TSlug, TSelect>,
      TDisableErrors
    >
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

type FindByIDLocalMethod = <
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  options: LocalAPIOptions<FindByIDOptions<TSlug, TDisableErrors, TSelect>>,
) => Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>>

const findByIDSchema = z.looseObject({
  ...collectionInput,
  id: idSchema.describe(
    'Optional: specific document ID to retrieve. If not provided, returns all documents',
  ),
  draft: z.boolean().describe('Return the latest draft when available').optional(),
  flattenLocales: z.boolean().optional(),
  joins: z
    .union([z.record(z.string(), z.unknown()), z.literal(false)])
    .describe('Optional: configure join field queries, or pass false to disable all join fields.')
    .optional(),
  trash: z.boolean().describe('Include soft-deleted documents').optional(),
})

export const findByIDLocalAPI = defineLocalAPI<FindByIDLocalMethod>()({ name: 'findByID' })

export const findByID = defineOperation({
  action: 'findByID',
  expose: {
    local: findByIDLocalAPI,
    rest: [
      {
        method: 'get',
        path: '/:id',
      },
    ],
  },
  handler: async <
    TSlug extends CollectionSlug,
    TDisableErrors extends boolean,
    TSelect extends SelectFromCollectionSlug<TSlug>,
  >(
    payload: Payload,
    options: FindByIDOptions<TSlug, TDisableErrors, TSelect>,
  ): Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>> => {
    const {
      id,
      collection: collectionSlug,
      currentDepth,
      data,
      depth,
      disableErrors = false,
      draft = false,
      flattenLocales,
      includeLockStatus,
      joins,
      overrideAccess = true,
      populate,
      select,
      showHiddenFields,
      trash = false,
    } = options

    const collection = payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError(
        `The collection with slug ${String(collectionSlug)} can't be found. Find By ID Operation.`,
      )
    }

    return findDocumentByID<TSlug, TDisableErrors, TSelect>({
      id,
      collection,
      currentDepth,
      data,
      depth,
      disableErrors,
      draft,
      flattenLocales,
      includeLockStatus,
      joins,
      overrideAccess,
      populate,
      req: await createLocalReq(options as CreateLocalReqOptions, payload),
      select,
      showHiddenFields,
      trash,
    })
  },
  input: findByIDSchema,
  target: 'collection',
})

type FindByIDOptionsBase<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectType,
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
   * The current population depth, used internally for relationships population.
   * @internal
   */
  currentDepth?: number
  /**
   * You may pass the document data directly which will skip the `db.findOne` database query.
   * This is useful if you want to use this endpoint solely for running hooks and populating data.
   */
  data?: Record<string, unknown>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * When set to `true`, errors will not be thrown.
   * `null` will be returned instead, if the document on this ID was not found.
   */
  disableErrors?: TDisableErrors
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: TypedFallbackLocale
  /**
   * The ID of the document to find.
   */
  id: number | string
  /**
   * Include info about the lock status to the result with fields: `_isLocked` and `_userEditing`
   */
  includeLockStatus?: boolean
  /**
   * The [Join Field Query](https://payloadcms.com/docs/fields/join#query-options).
   * Pass `false` to disable all join fields from the result.
   */
  joins?: JoinQuery<TSlug>
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
   * When set to `true`, the operation will return a document by ID, even if it is trashed (soft-deleted).
   * By default (`false`), the operation will exclude trashed documents.
   * To fetch a trashed document, set `trash: true`.
   *
   * This argument has no effect unless `trash` is enabled on the collection.
   * @default false
   */
  trash?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindDocumentByIDArgs, 'flattenLocales'> &
  Pick<FindOptions<TSlug, TSelect>, 'select'>

export type FindByIDOptions<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectType,
> = DraftFlagFromCollectionSlug<TSlug> & FindByIDOptionsBase<TSlug, TDisableErrors, TSelect>
