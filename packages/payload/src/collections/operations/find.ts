import type { AccessResult } from '../../config/types'
import type { PaginatedDocs } from '../../database/types'
import type { PayloadRequest } from '../../express/types'
import type { Where } from '../../types'
import type { Collection, TypeWithID } from '../config/types'

import executeAccess from '../../auth/executeAccess'
import { combineQueries } from '../../database/combineQueries'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths'
import { afterRead } from '../../fields/hooks/afterRead'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey'
import { getQueryDraftsSort } from '../../versions/drafts/getQueryDraftsSort'
import { buildAfterOperation } from './utils'

export type Arguments = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  limit?: number
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: string
  where?: Where
}

async function find<T extends TypeWithID & Record<string, unknown>>(
  incomingArgs: Arguments,
): Promise<PaginatedDocs<T>> {
  let args = incomingArgs

  try {
    const shouldCommit = await initTransaction(args.req)

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

    let result: PaginatedDocs<T>

    let fullWhere = combineQueries(where, accessResult)

    if (collectionConfig.versions?.drafts && draftsEnabled) {
      fullWhere = appendVersionToQueryKey(fullWhere)

      await validateQueryPaths({
        collectionConfig: collection.config,
        overrideAccess,
        req,
        versionFields: buildVersionCollectionFields(collection.config),
        where: fullWhere,
      })

      result = await payload.db.queryDrafts<T>({
        collection: collectionConfig.slug,
        limit: sanitizedLimit,
        locale,
        page: sanitizedPage,
        pagination: usePagination,
        req,
        sort: getQueryDraftsSort(sort),
        where: fullWhere,
      })
    } else {
      await validateQueryPaths({
        collectionConfig,
        overrideAccess,
        req,
        where,
      })

      const dbArgs = {
        collection: collectionConfig.slug,
        limit: sanitizedLimit,
        locale,
        page: sanitizedPage,
        pagination,
        req,
        sort,
        where: fullWhere,
      }

      if (collectionConfig?.db?.find) {
        result = await collectionConfig.db.find<T>(dbArgs)
      } else {
        result = await payload.db.find<T>(dbArgs)
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
          afterRead<T>({
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

    result = await buildAfterOperation<T>({
      args,
      collection: collectionConfig,
      operation: 'find',
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

export default find
