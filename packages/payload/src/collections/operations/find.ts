import type { AccessResult } from '../../config/types.js'
import type { PaginatedDocs } from '../../database/types.js'
import type { CollectionSlug, JoinQuery } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { Collection, DataFromCollectionSlug } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
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
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: string
  where?: Where
}

export const findOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments,
): Promise<PaginatedDocs<DataFromCollectionSlug<TSlug>>> => {
  let args = incomingArgs

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
      await priorHook

      args =
        (await hook({
          args,
          collection: args.collection.config,
          context: args.req.context,
          operation: 'read',
          req: args.req,
        })) || args
    }, Promise.resolve())

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
      req: { fallbackLocale, locale, payload },
      req,
      showHiddenFields,
      sort,
      where,
    } = args

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

    if (collectionConfig.versions?.drafts && draftsEnabled) {
      fullWhere = appendVersionToQueryKey(fullWhere)

      await validateQueryPaths({
        collectionConfig: collection.config,
        overrideAccess,
        req,
        versionFields: buildVersionCollectionFields(payload.config, collection.config),
        where: fullWhere,
      })

      const queryDraftArgs = {
        collection: collectionConfig.slug,
        limit: sanitizedLimit,
        locale,
        page: sanitizedPage,
        pagination: usePagination,
        req,
        sort: getQueryDraftsSort(sort),
        where: fullWhere,
      }
      // @ts-expect-error exists
      if (collectionConfig?.db?.queryDrafts) {
        result =
          // @ts-expect-error exists
          await collectionConfig.db.queryDrafts<DataFromCollectionSlug<TSlug>>(queryDraftArgs)
      } else {
        result = await payload.db.queryDrafts<DataFromCollectionSlug<TSlug>>(queryDraftArgs)
      }
    } else {
      await validateQueryPaths({
        collectionConfig,
        overrideAccess,
        req,
        where,
      })

      const dbArgs = {
        collection: collectionConfig.slug,
        joins: req.payloadAPI === 'GraphQL' ? false : joins,
        limit: sanitizedLimit,
        locale,
        page: sanitizedPage,
        pagination,
        req,
        sort,
        where: fullWhere,
      }

      // @ts-expect-error exists
      if (collectionConfig?.db?.find) {
        // @ts-expect-error exists
        result = await collectionConfig.db.find<DataFromCollectionSlug<TSlug>>(dbArgs)
      } else {
        result = await payload.db.find<DataFromCollectionSlug<TSlug>>(dbArgs)
      }
    }

    if (includeLockStatus) {
      try {
        const lockedDocuments = await payload.find({
          collection: 'payload-locked-documents',
          depth: 1,
          limit: sanitizedLimit,
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
            ],
          },
        })

        const lockedDocs = Array.isArray(lockedDocuments?.docs) ? lockedDocuments.docs : []

        result.docs = result.docs.map((doc) => {
          const lockedDoc = lockedDocs.find((lock) => lock?.document?.value === doc.id)
          return {
            ...doc,
            _isLocked: !!lockedDoc,
            _userEditing: lockedDoc ? lockedDoc?.user?.value : null,
          }
        })
      } catch (error) {
        result.docs = result.docs.map((doc) => ({
          ...doc,
          _isLocked: false,
          _userEditing: null,
        }))
      }
    }

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    result = {
      ...result,
      docs: await Promise.all(
        result.docs.map(async (doc) => {
          let docRef = doc

          await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
            await priorHook

            docRef =
              (await hook({
                collection: collectionConfig,
                context: req.context,
                doc: docRef,
                query: fullWhere,
                req,
              })) || docRef
          }, Promise.resolve())

          return docRef
        }),
      ),
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = {
      ...result,
      docs: await Promise.all(
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
            req,
            showHiddenFields,
          }),
        ),
      ),
    }

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    result = {
      ...result,
      docs: await Promise.all(
        result.docs.map(async (doc) => {
          let docRef = doc

          await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
            await priorHook

            docRef =
              (await hook({
                collection: collectionConfig,
                context: req.context,
                doc: docRef,
                findMany: true,
                query: fullWhere,
                req,
              })) || doc
          }, Promise.resolve())

          return docRef
        }),
      ),
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

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
