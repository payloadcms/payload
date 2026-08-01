import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type { AccessResult } from '../../config/types.js'
import type {
  CollectionSlug,
  FindOptions,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type {
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
  Where,
} from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type {
  BulkOperationResult,
  Collection,
  DataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { collectionInput, idSchema, operationWhereSchema } from '../../operations/schemaFields.js'
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { hasScheduledPublishEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isErrorPublic } from '../../utilities/isErrorPublic.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions.js'
import { deleteScheduledPublishJobs } from '../../versions/deleteScheduledPublishJobs.js'
import { deleteDocument } from './deleteByID.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

type DeleteDocumentsArgs = {
  collection: Collection
  depth?: number
  disableTransaction?: boolean
  overrideAccess?: boolean
  overrideLock?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
  trash?: boolean
  where: Where
} & Pick<FindOptions<string, SelectType>, 'select'>

export const deleteDocuments = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: DeleteDocumentsArgs,
): Promise<BulkOperationResult<TSlug, TSelect>> => {
  let args = incomingArgs

  if (args.collection.config.disableBulkDelete && !args.overrideAccess) {
    throw new APIError(`Collection ${args.collection.config.slug} has disabled bulk delete`, 403)
  }

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(args.req))
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'delete',
      overrideAccess: args.overrideAccess!,
    })

    const {
      collection: { config: collectionConfig },
      depth,
      overrideAccess,
      overrideLock,
      populate,
      req: {
        fallbackLocale,
        locale,
        payload: { config },
        payload,
      },
      req,
      select: incomingSelect,
      showHiddenFields,
      trash = false,
      where,
    } = args

    if (!where) {
      throw new APIError("Missing 'where' query of documents to delete.", httpStatus.BAD_REQUEST)
    }

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ req }, collectionConfig.access.delete)
    }

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req,
      where,
    })

    let fullWhere = combineQueries(where, accessResult!)

    // Exclude trashed documents when trash: false
    fullWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    sanitizeWhereQuery({ fields: collectionConfig.flattenedFields, payload, where: fullWhere })

    const select = sanitizeSelect({
      fields: collectionConfig.flattenedFields,
      select: resolveSelect({
        config: collectionConfig.select,
        operation: 'delete',
        req,
        select: incomingSelect,
      }),
    })

    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////

    const { docs } = await payload.db.find<DataFromCollectionSlug<TSlug>>({
      collection: collectionConfig.slug,
      locale: locale!,
      req,
      select,
      where: fullWhere,
    })

    const errors: BulkOperationResult<TSlug, TSelect>['errors'] = []

    const promises = docs.map(async (doc) => {
      let result

      const { id } = doc

      try {
        // Each document gets its own transaction when singleTransaction is enabled
        let docShouldCommit = false
        if (req.payload.db.bulkOperationsSingleTransaction) {
          docShouldCommit = await initTransaction(req)
        }

        // /////////////////////////////////////
        // Handle potentially locked documents
        // /////////////////////////////////////

        await checkDocumentLockStatus({
          id,
          collectionSlug: collectionConfig.slug,
          lockErrorMessage: `Document with ID ${id} is currently locked and cannot be deleted.`,
          overrideLock,
          req,
        })

        // /////////////////////////////////////
        // beforeDelete - Collection
        // /////////////////////////////////////

        if (collectionConfig.hooks?.beforeDelete?.length) {
          for (const hook of collectionConfig.hooks.beforeDelete) {
            await hook({
              id,
              collection: collectionConfig,
              context: req.context,
              req,
            })
          }
        }

        await deleteAssociatedFiles({
          collectionConfig,
          config,
          doc,
          overrideDelete: true,
          req,
        })

        // /////////////////////////////////////
        // Delete versions
        // /////////////////////////////////////

        if (collectionConfig.versions) {
          await deleteCollectionVersions({
            id,
            slug: collectionConfig.slug,
            payload,
            req,
          })
        }

        // /////////////////////////////////////
        // Delete scheduled posts
        // /////////////////////////////////////
        if (hasScheduledPublishEnabled(collectionConfig)) {
          await deleteScheduledPublishJobs({
            id,
            slug: collectionConfig.slug,
            payload,
            req,
          })
        }

        // /////////////////////////////////////
        // Delete document
        // /////////////////////////////////////

        await payload.db.deleteOne({
          collection: collectionConfig.slug,
          req,
          returning: false,
          where: {
            id: {
              equals: id,
            },
          },
        })

        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////

        result = await afterRead({
          collection: collectionConfig,
          context: req.context,
          depth: depth!,
          doc: result || doc,
          // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
          draft: undefined,
          fallbackLocale: fallbackLocale!,
          global: null,
          locale: locale!,
          overrideAccess: overrideAccess!,
          populate,
          req,
          select,
          showHiddenFields: showHiddenFields!,
        })

        // /////////////////////////////////////
        // Add collection property for auth collections
        // /////////////////////////////////////

        if (collectionConfig.auth) {
          result = { ...result, collection: collectionConfig.slug }
        }

        // /////////////////////////////////////
        // afterRead - Collection
        // /////////////////////////////////////

        if (collectionConfig.hooks?.afterRead?.length) {
          for (const hook of collectionConfig.hooks.afterRead) {
            result =
              (await hook({
                collection: collectionConfig,
                context: req.context,
                doc: result || doc,
                overrideAccess,
                req,
              })) || result
          }
        }

        // /////////////////////////////////////
        // afterDelete - Collection
        // /////////////////////////////////////

        if (collectionConfig.hooks?.afterDelete?.length) {
          for (const hook of collectionConfig.hooks.afterDelete) {
            result =
              (await hook({
                id,
                collection: collectionConfig,
                context: req.context,
                doc: result,
                req,
              })) || result
          }
        }

        // /////////////////////////////////////
        // 8. Return results
        // /////////////////////////////////////
        if (docShouldCommit) {
          await commitTransaction(req)
        }

        return result
      } catch (error) {
        const isPublic = error instanceof Error ? isErrorPublic(error, config) : false

        if (req.payload.db.bulkOperationsSingleTransaction) {
          await killTransaction(req)
        }
        errors.push({
          id: doc.id,
          isPublic,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      return null
    })

    // Process sequentially when using single transaction mode to avoid shared state issues
    // Process in parallel when using one transaction for better performance
    let awaitedDocs
    if (req.payload.db.bulkOperationsSingleTransaction) {
      awaitedDocs = []
      for (const promise of promises) {
        awaitedDocs.push(await promise)
      }
    } else {
      awaitedDocs = await Promise.all(promises)
    }

    // /////////////////////////////////////
    // Delete Preferences
    // /////////////////////////////////////

    await deleteUserPreferences({
      collectionConfig,
      ids: docs.map(({ id }) => id),
      payload,
      req,
    })

    let result = {
      docs: awaitedDocs.filter(Boolean),
      errors,
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'delete',
      overrideAccess,
      result,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

type DeleteLocalMethod = {
  <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: LocalAPIOptions<DeleteByIDOptions<TSlug, TSelect>>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>>
  <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: LocalAPIOptions<DeleteManyOptions<TSlug, TSelect>>,
  ): Promise<BulkOperationResult<TSlug, TSelect>>
}

const deleteSchema = z
  .looseObject({
    ...collectionInput,
    id: idSchema.describe('A document ID to delete').optional(),
    overrideLock: z.boolean().optional(),
    trash: z.boolean().describe('Include soft-deleted documents').optional(),
    where: operationWhereSchema.describe('Documents to delete').optional(),
  })
  .refine((input) => input.id !== undefined || input.where !== undefined, {
    message: 'Either id or where must be provided',
  })

export const deleteLocalAPI = defineLocalAPI<DeleteLocalMethod>()({ name: 'delete' })

export const remove = defineOperation({
  action: 'delete',
  expose: {
    local: deleteLocalAPI,
    mcp: { name: 'deleteDocuments' },
    rest: [
      {
        method: 'delete',
        path: '/',
      },
      {
        method: 'delete',
        path: '/:id',
      },
    ],
  },
  handler: deleteHandler,
  input: deleteSchema,
  target: 'collection',
})

type DeleteOptionsBase<TSlug extends CollectionSlug, TSelect extends SelectType> = {
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
   * When set to `true`, a [database transactions](https://payloadcms.com/docs/database/transactions) will not be initialized.
   * @default false
   */
  disableTransaction?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: TypedLocale
  /**
   * Skip access control.
   * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
   * @default true
   */
  overrideAccess?: boolean
  /**
   * By default, document locks are ignored (`true`). Set to `false` to enforce locks and prevent operations when a document is locked by another user. [More details](https://payloadcms.com/docs/admin/locked-documents).
   * @default true
   */
  overrideLock?: boolean
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
   * When set to `true`, the operation will permanently delete both normal and trashed documents.
   * By default (`false`), only normal (non-trashed) documents will be permanently deleted.
   *
   * This argument has no effect unless `trash` is enabled on the collection.
   * @default false
   */
  trash?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<TSlug, TSelect>, 'select'>

export type DeleteByIDOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = {
  /**
   * The ID of the document to delete.
   */
  id: number | string
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: never
} & DeleteOptionsBase<TSlug, TSelect>

export type DeleteManyOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = {
  /**
   * The ID of the document to delete.
   */
  id?: never
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where: Where
} & DeleteOptionsBase<TSlug, TSelect>

export type DeleteOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = DeleteByIDOptions<TSlug, TSelect> | DeleteManyOptions<TSlug, TSelect>

async function deleteHandler<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: DeleteByIDOptions<TSlug, TSelect>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>>

async function deleteHandler<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: DeleteManyOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect>>

async function deleteHandler<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: DeleteOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>>

async function deleteHandler<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: DeleteOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    disableTransaction,
    overrideAccess = true,
    overrideLock,
    populate,
    select,
    showHiddenFields,
    trash = false,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Delete Operation.`,
    )
  }

  const args = {
    id,
    collection,
    depth,
    disableTransaction,
    overrideAccess,
    overrideLock,
    populate,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    select,
    showHiddenFields,
    trash,
    where,
  }

  if (options.id) {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return deleteDocument<TSlug, TSelect>(args)
  }
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  return deleteDocuments<TSlug, TSelect>(args)
}
