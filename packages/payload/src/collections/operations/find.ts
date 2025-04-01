// @ts-strict-ignore
import type { AccessResult } from '../../config/types.js'
import type { PaginatedDocs } from '../../database/types.js'
import type { CollectionSlug, JoinQuery } from '../../index.js'
import type {
  PayloadRequest,
  PopulateType,
  SelectType,
  Sort,
  TransformCollectionWithSelect,
  Where,
} from '../../types/index.js'
import type {
  Collection,
  DataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeJoinQuery } from '../../database/sanitizeJoinQuery.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { lockedDocumentsCollectionSlug } from '../../locked-documents/config.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { getQueryDraftsSelect } from '../../versions/drafts/getQueryDraftsSelect.js'
import { getQueryDraftsSort } from '../../versions/drafts/getQueryDraftsSort.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
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
  select?: SelectType
  showHiddenFields?: boolean
  sort?: Sort
  where?: Where
}

const lockDurationDefault = 300 // Default 5 minutes in seconds

export const findOperation = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: Arguments,
): Promise<PaginatedDocs<TransformCollectionWithSelect<TSlug, TSelect>>> => {
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
      collection: { config: collectionConfig },
      collection,
      currentDepth,
      depth,
      disableErrors,
      draft: draftsEnabled,
      includeLockStatus,
      joins,
      limit,
      overrideAccess,
      page,
      pagination = true,
      populate,
      req: { fallbackLocale, locale, payload },
      req,
      select: incomingSelect,
      showHiddenFields,
      sort,
      where,
    } = args

    const select = sanitizeSelect({
      forceSelect: collectionConfig.forceSelect,
      select: incomingSelect,
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
          limit,
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

    let fullWhere = combineQueries(where, accessResult)

    const sanitizedJoins = await sanitizeJoinQuery({
      collectionConfig,
      joins,
      overrideAccess,
      req,
    })

    if (collectionConfig.versions?.drafts && draftsEnabled) {
      fullWhere = appendVersionToQueryKey(fullWhere)

      await validateQueryPaths({
        collectionConfig: collection.config,
        overrideAccess,
        req,
        versionFields: buildVersionCollectionFields(payload.config, collection.config, true),
        where: appendVersionToQueryKey(where),
      })

      result = await payload.db.queryDrafts<DataFromCollectionSlug<TSlug>>({
        collection: collectionConfig.slug,
        joins: req.payloadAPI === 'GraphQL' ? false : sanitizedJoins,
        limit: sanitizedLimit,
        locale,
        page: sanitizedPage,
        pagination: usePagination,
        req,
        select: getQueryDraftsSelect({ select }),
        sort: getQueryDraftsSort({ collectionConfig, sort }),
        where: fullWhere,
      })
    } else {
      await validateQueryPaths({
        collectionConfig,
        overrideAccess,
        req,
        where,
      })

      result = await payload.db.find<DataFromCollectionSlug<TSlug>>({
        collection: collectionConfig.slug,
        draftsEnabled,
        joins: req.payloadAPI === 'GraphQL' ? false : sanitizedJoins,
        limit: sanitizedLimit,
        locale,
        page: sanitizedPage,
        pagination,
        req,
        select,
        sort,
        where: fullWhere,
      })
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
          depth,
          doc,
          draft: draftsEnabled,
          fallbackLocale,
          findMany: true,
          global: null,
          locale,
          overrideAccess,
          populate,
          req,
          select,
          showHiddenFields,
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
                query: fullWhere,
                req,
              })) || doc
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
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result as PaginatedDocs<TransformCollectionWithSelect<TSlug, TSelect>>
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
