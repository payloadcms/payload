// @ts-strict-ignore
import type { FindOneArgs } from '../../database/types.js'
import type { CollectionSlug, JoinQuery } from '../../index.js'
import type {
  ApplyDisableErrors,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type {
  Collection,
  DataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { sanitizeJoinQuery } from '../../database/sanitizeJoinQuery.js'
import { NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { validateQueryPaths } from '../../index.js'
import { lockedDocumentsCollectionSlug } from '../../locked-documents/config.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import replaceWithDraftIfAvailable from '../../versions/drafts/replaceWithDraftIfAvailable.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  id: number | string
  includeLockStatus?: boolean
  joins?: JoinQuery
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
}

export const findByIDOperation = async <
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: Arguments,
): Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>> => {
  let args = incomingArgs

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    if (args.collection.config.hooks?.beforeOperation?.length) {
      for (const hook of args.collection.config.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            collection: args.collection.config,
            context: args.req.context,
            operation: 'read',
            req: args.req,
          })) || args
      }
    }

    const {
      id,
      collection: { config: collectionConfig },
      currentDepth,
      depth,
      disableErrors,
      draft: draftEnabled = false,
      includeLockStatus,
      joins,
      overrideAccess = false,
      populate,
      req: { fallbackLocale, locale, t },
      req,
      select: incomingSelect,
      showHiddenFields,
    } = args

    const select = sanitizeSelect({
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
      return null
    }

    const where = { id: { equals: id } }

    const fullWhere = combineQueries(where, accessResult)

    const sanitizedJoins = await sanitizeJoinQuery({
      collectionConfig,
      joins,
      overrideAccess,
      req,
    })

    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      draftsEnabled: draftEnabled,
      joins: req.payloadAPI === 'GraphQL' ? false : sanitizedJoins,
      locale,
      req: {
        transactionID: req.transactionID,
      } as PayloadRequest,
      select,
      where: fullWhere,
    }

    // execute only if there's a custom ID and potentially overwriten access on id
    if (req.payload.collections[collectionConfig.slug].customIDType) {
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

    if (!findOneArgs.where.and[0].id) {
      throw new NotFound(t)
    }

    let result: DataFromCollectionSlug<TSlug> = await req.payload.db.findOne(findOneArgs)

    if (!result) {
      if (!disableErrors) {
        throw new NotFound(req.t)
      }

      return null
    }

    // /////////////////////////////////////
    // Include Lock Status if required
    // /////////////////////////////////////

    if (includeLockStatus && id) {
      let lockStatus = null

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
          lockStatus = lockedDocument.docs[0]
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

    if (collectionConfig.versions?.drafts && draftEnabled) {
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
      depth,
      doc: result,
      draft: draftEnabled,
      fallbackLocale,
      global: null,
      locale,
      overrideAccess,
      populate,
      req,
      select,
      showHiddenFields,
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
