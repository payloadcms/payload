import { status as httpStatus } from 'http-status'

import type { AccessResult } from '../../config/types.js'
import type { CollectionSlug, FindOptions } from '../../index.js'
import type { PayloadRequest, PopulateType, SelectType, Where } from '../../types/index.js'
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
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { hasScheduledPublishEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isErrorPublic } from '../../utilities/isErrorPublic.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions.js'
import { deleteScheduledPublishJobs } from '../../versions/deleteScheduledPublishJobs.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

export type Arguments = {
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

export const deleteOperation = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: Arguments,
): Promise<BulkOperationResult<TSlug, TSelect>> => {
  let args = incomingArgs

  const useSeparateTransactions = args.req.payload.db.bulkOperationsSingleTransaction

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
      forceSelect: collectionConfig.forceSelect,
      select: incomingSelect,
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

    // Track all doc requests that have open transactions (for separate transaction mode)
    const docReqsWithTransactions: PayloadRequest[] = []

    const promises = docs.map(async (doc) => {
      let result

      const { id } = doc

      // When using separate transactions, isolate the transactionID so each doc gets its own
      let docReq = req

      if (useSeparateTransactions) {
        docReq = isolateObjectProperty(req, 'transactionID')
        delete docReq.transactionID
        await initTransaction(docReq)
        docReqsWithTransactions.push(docReq)
      }

      try {
        // /////////////////////////////////////
        // Handle potentially locked documents
        // /////////////////////////////////////

        await checkDocumentLockStatus({
          id,
          collectionSlug: collectionConfig.slug,
          lockErrorMessage: `Document with ID ${id} is currently locked and cannot be deleted.`,
          overrideLock,
          req: docReq,
        })

        // /////////////////////////////////////
        // beforeDelete - Collection
        // /////////////////////////////////////

        if (collectionConfig.hooks?.beforeDelete?.length) {
          for (const hook of collectionConfig.hooks.beforeDelete) {
            await hook({
              id,
              collection: collectionConfig,
              context: docReq.context,
              req: docReq,
            })
          }
        }

        await deleteAssociatedFiles({
          collectionConfig,
          config,
          doc,
          overrideDelete: true,
          req: docReq,
        })

        // /////////////////////////////////////
        // Delete versions
        // /////////////////////////////////////

        if (collectionConfig.versions) {
          await deleteCollectionVersions({
            id,
            slug: collectionConfig.slug,
            payload,
            req: docReq,
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
            req: docReq,
          })
        }

        // /////////////////////////////////////
        // Delete document
        // /////////////////////////////////////

        await payload.db.deleteOne({
          collection: collectionConfig.slug,
          req: docReq,
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
          context: docReq.context,
          depth: depth!,
          doc: result || doc,
          // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
          draft: undefined,
          fallbackLocale: fallbackLocale!,
          global: null,
          locale: locale!,
          overrideAccess: overrideAccess!,
          populate,
          req: docReq,
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
                context: docReq.context,
                doc: result || doc,
                overrideAccess,
                req: docReq,
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
                context: docReq.context,
                doc: result,
                req: docReq,
              })) || result
          }
        }

        // Don't commit here - wait until all docs complete successfully
        return result
      } catch (error) {
        docReq.payload.logger.error({ err: error, msg: `Error deleting document ${id}` })

        const isPublic = error instanceof Error ? isErrorPublic(error, config) : false

        errors.push({
          id: doc.id,
          isPublic,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      return null
    })

    const awaitedDocs = await Promise.all(promises)

    // Handle errors - same behavior regardless of useSeparateTransactions: if any error, abort everything
    if (errors.length > 0) {
      if (useSeparateTransactions) {
        for (const docReq of docReqsWithTransactions) {
          await killTransaction(docReq)
        }
      }
      await killTransaction(req)

      // All docs failed because all transactions were rolled back
      const allErrors: BulkOperationResult<TSlug, TSelect>['errors'] = docs.map((doc) => {
        const existingError = errors.find((e) => e.id === doc.id)
        if (existingError) {
          return existingError
        }
        return {
          id: doc.id,
          isPublic: false,
          message: 'Transaction rolled back due to error in another document',
        }
      })

      return {
        docs: [],
        errors: allErrors,
      }
    }

    if (useSeparateTransactions) {
      for (const docReq of docReqsWithTransactions) {
        await commitTransaction(docReq)
      }
    }

    // /////////////////////////////////////
    // Delete Preferences
    // /////////////////////////////////////

    if (docs.length > 0) {
      await deleteUserPreferences({
        collectionConfig,
        ids: docs.map((d) => d.id),
        payload,
        req,
      })
    }

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
