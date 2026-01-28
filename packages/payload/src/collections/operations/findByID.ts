import type { FindOneArgs } from '../../database/types.js'
import type { CollectionSlug, FindOptions, JoinQuery } from '../../index.js'
import type {
  ApplyDisableErrors,
  JsonObject,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type {
  Collection,
  DataFromCollectionSlug,
  SelectFromCollectionSlug,
  TypeWithID,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { sanitizeJoinQuery } from '../../database/sanitizeJoinQuery.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { NotFound } from '../../errors/index.js'
import { afterRead, type AfterReadArgs } from '../../fields/hooks/afterRead/index.js'
import { validateQueryPaths } from '../../index.js'
import { lockedDocumentsCollectionSlug } from '../../locked-documents/config.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { getSelectMode } from '../../utilities/getSelectMode.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { replaceWithDraftIfAvailable } from '../../versions/drafts/replaceWithDraftIfAvailable.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

export type FindByIDArgs = {
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

export const findByIDOperation = async <
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: FindByIDArgs,
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
      forceSelect: collectionConfig.forceSelect,
      select: incomingSelect,
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

    const docFromDB = await req.payload.db.findOne(findOneArgs)

    if (!docFromDB && !args.data) {
      if (!disableErrors) {
        throw new NotFound(req.t)
      }
      return null!
    }

    let result: DataFromCollectionSlug<TSlug> =
      (args.data as DataFromCollectionSlug<TSlug>) ?? docFromDB!

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
