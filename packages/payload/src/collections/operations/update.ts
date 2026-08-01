import type { I18n } from '@payloadcms/translations'
import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type { SanitizedCollectionPermission } from '../../auth/types.js'
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
  Sort,
  TransformCollectionWithSelect,
  Where,
} from '../../types/index.js'
import type { File } from '../../uploads/types.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type {
  BulkOperationResult,
  Collection,
  DataFromCollectionSlug,
  DraftFlagFromCollectionSlug,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import {
  getCollectionOperationInputSchema,
  validateCollectionOperationData,
} from '../../operations/entitySchema.js'
import { prepareCollectionOperationData } from '../../operations/prepareData.js'
import {
  collectionInput,
  dataSchema,
  idSchema,
  operationWhereSchema,
  paginatedInput,
  sortSchema,
} from '../../operations/schemaFields.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import { getFileByPath } from '../../uploads/getFileByPath.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isErrorPublic } from '../../utilities/isErrorPublic.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { getQueryDraftsSort } from '../../versions/drafts/getQueryDraftsSort.js'
import { updateDocumentByID } from './updateByID.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'
import { copyDataWithFreshRowIDs } from './utilities/copyDataWithFreshRowIDs.js'
import { sanitizeSortQuery } from './utilities/sanitizeSortQuery.js'
import { updateDocument } from './utilities/update.js'

type UpdateDocumentsArgs<TSlug extends CollectionSlug> = {
  autosave?: boolean
  collection: Collection
  data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  depth?: number
  disableTransaction?: boolean
  disableVerificationEmail?: boolean
  draft?: boolean
  limit?: number
  overrideAccess?: boolean
  overrideLock?: boolean
  overwriteExistingFiles?: boolean
  populate?: PopulateType
  publishAllLocales?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-createdAt' // Sort DESC by createdAt
   * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  trash?: boolean
  unpublishAllLocales?: boolean
  where: Where
} & Pick<FindOptions<TSlug, SelectType>, 'select'>

export const updateDocuments = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: UpdateDocumentsArgs<TSlug>,
): Promise<BulkOperationResult<TSlug, TSelect>> => {
  let args = incomingArgs

  if (args.collection.config.disableBulkEdit && !args.overrideAccess) {
    throw new APIError(`Collection ${args.collection.config.slug} has disabled bulk edit`, 403)
  }

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(args.req))

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'update',
      overrideAccess: args.overrideAccess!,
    })

    const {
      autosave = false,
      collection: { config: collectionConfig },
      collection,
      depth,
      draft: draftArg = false,
      limit = 0,
      overrideAccess,
      overrideLock,
      overwriteExistingFiles = false,
      populate,
      publishAllLocales,
      req: {
        fallbackLocale,
        locale,
        payload: { config },
        payload,
      },
      req,
      select: incomingSelect,
      showHiddenFields,
      sort: incomingSort,
      trash = false,
      unpublishAllLocales,
      where,
    } = args

    if (!where) {
      throw new APIError("Missing 'where' query of documents to update.", httpStatus.BAD_REQUEST)
    }

    const { data: bulkUpdateData } = args
    const shouldSaveDraft = Boolean(draftArg && hasDraftsEnabled(collectionConfig))

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult
    if (!overrideAccess) {
      accessResult = await executeAccess({ req }, collectionConfig.access.update)
    }

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req,
      where,
    })

    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////

    let fullWhere = combineQueries(where, accessResult!)

    const isTrashAttempt =
      collectionConfig.trash &&
      typeof bulkUpdateData === 'object' &&
      bulkUpdateData !== null &&
      'deletedAt' in bulkUpdateData &&
      bulkUpdateData.deletedAt != null

    // Enforce delete access if performing a soft-delete (trash)
    if (isTrashAttempt && !overrideAccess) {
      // Pass data so access function can check data.deletedAt to know it's a trash attempt
      const deleteAccessResult = await executeAccess(
        { data: bulkUpdateData, req },
        collectionConfig.access.delete,
      )
      fullWhere = combineQueries(fullWhere, deleteAccessResult)
    }

    // Exclude trashed documents when trash: false
    fullWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    sanitizeWhereQuery({ fields: collectionConfig.flattenedFields, payload, where: fullWhere })

    const sort = sanitizeSortQuery({
      fields: collection.config.flattenedFields,
      sort: incomingSort,
    })

    let docs

    if (hasDraftsEnabled(collectionConfig) && (shouldSaveDraft || isTrashAttempt)) {
      const versionsWhere = appendVersionToQueryKey(fullWhere)

      await validateQueryPaths({
        collectionConfig: collection.config,
        overrideAccess: overrideAccess!,
        req,
        versionFields: buildVersionCollectionFields(payload.config, collection.config, true),
        where: appendVersionToQueryKey(where),
      })

      const query = await payload.db.queryDrafts<DataFromCollectionSlug<TSlug>>({
        collection: collectionConfig.slug,
        limit,
        locale: locale!,
        pagination: false,
        req,
        sort: getQueryDraftsSort({ collectionConfig, sort }),
        where: versionsWhere,
      })

      docs = query.docs
    } else {
      const query = await payload.db.find({
        collection: collectionConfig.slug,
        limit,
        locale: locale!,
        pagination: false,
        req,
        sort,
        where: fullWhere,
      })

      docs = query.docs
    }

    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////

    const { data, files: filesToUpload } = await generateFileData({
      collection,
      config,
      data: bulkUpdateData,
      operation: 'update',
      overwriteExistingFiles,
      req,
      throwOnMissingFile: false,
    })

    const errors: BulkOperationResult<TSlug, TSelect>['errors'] = []

    const promises = docs.map(async (docWithLocales) => {
      const { id } = docWithLocales

      try {
        // Each document gets its own transaction when singleTransaction is enabled
        let docShouldCommit = false
        if (req.payload.db.bulkOperationsSingleTransaction) {
          docShouldCommit = await initTransaction(req)
        }

        const select = sanitizeSelect({
          fields: collectionConfig.flattenedFields,
          select: resolveSelect({
            config: collectionConfig.select,
            operation: 'update',
            req,
            select: incomingSelect,
          }),
        })

        // ///////////////////////////////////////////////
        // Update document, runs all document level hooks
        // ///////////////////////////////////////////////
        let updatedDoc = await updateDocument({
          id,
          autosave,
          collectionConfig,
          config,
          data: copyDataWithFreshRowIDs({
            config,
            data,
            existingDoc: docWithLocales,
            fields: collectionConfig.fields,
          }),
          depth: depth!,
          docWithLocales,
          draftArg,
          fallbackLocale: fallbackLocale!,
          filesToUpload,
          locale: locale!,
          overrideAccess: overrideAccess!,
          overrideLock: overrideLock!,
          payload,
          populate,
          publishAllLocales,
          req,
          select: select!,
          showHiddenFields: showHiddenFields!,
          unpublishAllLocales,
        })

        // /////////////////////////////////////
        // Add collection property for auth collections
        // /////////////////////////////////////

        if (collectionConfig.auth) {
          updatedDoc = { ...updatedDoc, collection: collectionConfig.slug }
        }

        if (docShouldCommit) {
          await commitTransaction(req)
        }

        return updatedDoc
      } catch (error) {
        const isPublic = error instanceof Error ? isErrorPublic(error, config) : false

        if (req.payload.db.bulkOperationsSingleTransaction) {
          await killTransaction(req)
        }
        errors.push({
          id,
          isPublic,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      return null
    })

    await unlinkTempFiles({
      collectionConfig,
      config,
      req,
    })

    // Process sequentially when using single transaction mode to avoid shared state issues
    // Process in parallel when using one transaction for better performance
    let awaitedDocs: (DataFromCollectionSlug<TSlug> | null)[]
    if (req.payload.db.bulkOperationsSingleTransaction) {
      awaitedDocs = []
      for (const promise of promises) {
        awaitedDocs.push(await promise)
      }
    } else {
      awaitedDocs = await Promise.all(promises)
    }

    let result = {
      docs: awaitedDocs.filter(Boolean),
      errors,
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<TSlug, 'update'>({
      args,
      collection: collectionConfig,
      operation: 'update',
      overrideAccess,
      // @ts-expect-error -- failed bulk updates are represented as null before hook filtering
      result,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

type UpdateLocalMethod = {
  <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: LocalAPIOptions<UpdateByIDOptions<TSlug, TSelect>>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>>
  <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: LocalAPIOptions<UpdateManyOptions<TSlug, TSelect>>,
  ): Promise<BulkOperationResult<TSlug, TSelect>>
}

const updateSchema = z
  .looseObject({
    ...collectionInput,
    id: idSchema.describe('A document ID to update').optional(),
    autosave: z.boolean().optional(),
    data: dataSchema,
    draft: z.boolean().describe('Save the update as a draft').optional().default(false),
    limit: paginatedInput.limit,
    overrideLock: z.boolean().optional(),
    overwriteExistingFiles: z.boolean().optional().default(false),
    publishAllLocales: z.boolean().optional(),
    sort: sortSchema,
    trash: z.boolean().describe('Include soft-deleted documents').optional(),
    unpublishAllLocales: z.boolean().optional(),
    where: operationWhereSchema.describe('Documents to update').optional(),
  })
  .overwrite((input) => {
    const payload = (input.req as PayloadRequest | undefined)?.payload

    if (!payload) {
      return input
    }

    const data = prepareCollectionOperationData({
      collection: input.collection,
      config: payload.config,
      data: input.data,
    })

    validateCollectionOperationData({
      collection: input.collection,
      data,
      i18n: (input.req as { i18n?: I18n } | undefined)?.i18n,
      partial: true,
      payload,
    })

    return { ...input, data }
  })
  .refine((input) => input.id !== undefined || input.where !== undefined, {
    message: 'Either id or where must be provided',
  })

export const updateLocalAPI = defineLocalAPI<UpdateLocalMethod>()({ name: 'update' })

export const update = defineOperation({
  action: 'update',
  expose: {
    local: updateLocalAPI,
    mcp: { name: 'updateDocument' },
    rest: [
      {
        method: 'patch',
        path: '/',
      },
      {
        method: 'patch',
        path: '/:id',
      },
    ],
  },
  getDataSchema: ({ context: payload, input, permissions }) =>
    getCollectionOperationInputSchema({
      collection: input.collection,
      i18n: (input.req as { i18n?: I18n } | undefined)?.i18n,
      payload,
      permissions: permissions as SanitizedCollectionPermission | undefined,
    }),
  handler: updateHandler,
  input: updateSchema,
  target: 'collection',
})

type UpdateOptionsBase<TSlug extends CollectionSlug, TSelect extends SelectType> = {
  /**
   * Whether the current update should be marked as from autosave.
   * `versions.drafts.autosave` should be specified.
   */
  autosave?: boolean
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
   * The document / documents data to update.
   */
  data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
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
   * A `File` object when updating a collection with `upload: true`.
   */
  file?: File
  /**
   * A file path when creating a collection with `upload: true`.
   */
  filePath?: string
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
   * If you are uploading a file and would like to replace
   * the existing file instead of generating a new filename,
   * you can set the following property to `true`
   */
  overwriteExistingFiles?: boolean
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType
  /**
   * Publish the document / documents in all locales. Only applies when localization is enabled
   * and the collection has localized fields.
   *
   * @default undefined
   */
  publishAllLocales?: boolean
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
   * When set to `true`, the operation will update both normal and trashed (soft-deleted) documents.
   * To update only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
   * By default (`false`), the update will only include normal documents and exclude those with a `deletedAt` field.
   * @default false
   */
  trash?: boolean
  /**
   * Unpublish the document / documents in all locales. Only applies when localization is enabled
   * and the collection has localized fields.
   */
  unpublishAllLocales?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<TSlug, TSelect>, 'select'>

export type UpdateByIDOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = {
  /**
   * The ID of the document to update.
   */
  id: number | string
  /**
   * Limit documents to update
   */
  limit?: never
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-createdAt' // Sort DESC by createdAt
   * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: never
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: never
} & DraftFlagFromCollectionSlug<TSlug> &
  UpdateOptionsBase<TSlug, TSelect>

export type UpdateManyOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = {
  /**
   * The ID of the document to update.
   */
  id?: never
  /**
   * Limit documents to update
   */
  limit?: number
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-createdAt' // Sort DESC by createdAt
   * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where: Where
} & DraftFlagFromCollectionSlug<TSlug> &
  UpdateOptionsBase<TSlug, TSelect>

export type UpdateOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = UpdateByIDOptions<TSlug, TSelect> | UpdateManyOptions<TSlug, TSelect>

async function updateHandler<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: UpdateByIDOptions<TSlug, TSelect>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>>

async function updateHandler<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: UpdateManyOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect>>

async function updateHandler<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: UpdateOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>>

async function updateHandler<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: UpdateOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>> {
  const {
    id,
    autosave,
    collection: collectionSlug,
    data,
    depth,
    disableTransaction,
    draft,
    file,
    filePath,
    limit,
    overrideAccess = true,
    overrideLock,
    overwriteExistingFiles = false,
    populate,
    publishAllLocales,
    select,
    showHiddenFields,
    sort,
    trash = false,
    unpublishAllLocales,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Update Operation.`,
    )
  }

  const req = await createLocalReq(options as CreateLocalReqOptions, payload)
  req.file = file ?? (await getFileByPath(filePath!))

  const args = {
    id,
    autosave,
    collection,
    data,
    depth,
    disableTransaction,
    draft,
    limit,
    overrideAccess,
    overrideLock,
    overwriteExistingFiles,
    payload,
    populate,
    publishAllLocales,
    req,
    select,
    showHiddenFields,
    sort,
    trash,
    unpublishAllLocales,
    where,
  }

  if (options.id) {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return updateDocumentByID<TSlug, TSelect>(args)
  }
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  return updateDocuments<TSlug, TSelect>(args)
}
