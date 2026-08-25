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
import { APIError, Locked } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import {
  checkDocumentLockStatus,
  deleteDocumentLocks,
  getLockedDocumentIds,
} from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { hasScheduledPublishEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isErrorPublic } from '../../utilities/isErrorPublic.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
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
      accessResult = await executeAccess(
        { slug: collectionConfig.slug, req },
        collectionConfig.access.delete,
      )
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

    type Doc = DataFromCollectionSlug<TSlug>
    type ResultDoc = BulkOperationResult<TSlug, TSelect>['docs'][number]

    const pushError = (id: number | string, error: unknown) => {
      errors.push({
        id,
        isPublic: error instanceof Error ? isErrorPublic(error, config) : false,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // /////////////////////////////////////
    // beforeDelete - Collection, and associated files
    // /////////////////////////////////////

    const runBeforeDeleteWork = async (doc: Doc) => {
      if (collectionConfig.hooks?.beforeDelete?.length) {
        for (const hook of collectionConfig.hooks.beforeDelete) {
          await hook({
            id: doc.id,
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
    }

    // /////////////////////////////////////
    // afterRead - Fields, afterRead - Collection, afterDelete - Collection
    // /////////////////////////////////////

    const runAfterDeleteWork = async (doc: Doc): Promise<ResultDoc> => {
      let result = await afterRead({
        collection: collectionConfig,
        context: req.context,
        depth: depth!,
        doc,
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

      // Add collection property for auth collections
      if (collectionConfig.auth) {
        result = { ...result, collection: collectionConfig.slug }
      }

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

      if (collectionConfig.hooks?.afterDelete?.length) {
        for (const hook of collectionConfig.hooks.afterDelete) {
          result =
            (await hook({
              id: doc.id,
              collection: collectionConfig,
              context: req.context,
              doc: result,
              req,
            })) || result
        }
      }

      return result as ResultDoc
    }

    /**
     * One transaction and one set of database calls per document. Only used when
     * `bulkOperationsSingleTransaction` is enabled, which requires each document to be committed
     * on its own and therefore cannot share a batched write with the rest of the operation.
     */
    const deleteDocumentIndividually = async (doc: Doc): Promise<null | ResultDoc> => {
      try {
        const docShouldCommit = await initTransaction(req)

        await checkDocumentLockStatus({
          id: doc.id,
          collectionSlug: collectionConfig.slug,
          lockErrorMessage: `Document with ID ${doc.id} is currently locked and cannot be deleted.`,
          overrideLock,
          req,
        })

        await runBeforeDeleteWork(doc)

        if (collectionConfig.versions) {
          await deleteCollectionVersions({
            id: doc.id,
            slug: collectionConfig.slug,
            payload,
            req,
          })
        }

        if (hasScheduledPublishEnabled(collectionConfig)) {
          await deleteScheduledPublishJobs({
            id: doc.id,
            slug: collectionConfig.slug,
            payload,
            req,
          })
        }

        await payload.db.deleteOne({
          collection: collectionConfig.slug,
          req,
          returning: false,
          where: {
            id: {
              equals: doc.id,
            },
          },
        })

        const result = await runAfterDeleteWork(doc)

        if (docShouldCommit) {
          await commitTransaction(req)
        }

        return result
      } catch (error) {
        await killTransaction(req)
        pushError(doc.id, error)

        return null
      }
    }

    /**
     * Deletes the whole batch using a constant number of database calls, independent of how many
     * documents matched. Hooks still run per document, they just no longer each carry a write.
     */
    const deleteDocumentsInBulk = async (): Promise<(null | ResultDoc)[]> => {
      const results: (null | ResultDoc)[] = new Array(docs.length).fill(null)

      // /////////////////////////////////////
      // Handle potentially locked documents
      // /////////////////////////////////////

      const lockedIds = await getLockedDocumentIds({
        collectionSlug: collectionConfig.slug,
        ids: docs.map(({ id }) => id),
        overrideLock,
        req,
      })

      const unlocked: { doc: Doc; index: number }[] = []

      docs.forEach((doc, index) => {
        if (lockedIds.has(String(doc.id))) {
          pushError(
            doc.id,
            new Locked(`Document with ID ${doc.id} is currently locked and cannot be deleted.`),
          )

          return
        }

        unlocked.push({ doc, index })
      })

      await deleteDocumentLocks({
        collectionSlug: collectionConfig.slug,
        ids: unlocked.map(({ doc }) => doc.id),
        req,
      })

      const deletable: { doc: Doc; index: number }[] = []

      await Promise.all(
        unlocked.map(async (entry) => {
          try {
            await runBeforeDeleteWork(entry.doc)
            deletable.push(entry)
          } catch (error) {
            pushError(entry.doc.id, error)
          }
        }),
      )

      if (!deletable.length) {
        return results
      }

      const ids = deletable.map(({ doc }) => doc.id)

      // /////////////////////////////////////
      // Delete versions
      // /////////////////////////////////////

      if (collectionConfig.versions) {
        await deleteCollectionVersions({
          slug: collectionConfig.slug,
          ids,
          payload,
          req,
        })
      }

      // /////////////////////////////////////
      // Delete scheduled posts
      // /////////////////////////////////////

      if (hasScheduledPublishEnabled(collectionConfig)) {
        await deleteScheduledPublishJobs({
          slug: collectionConfig.slug,
          ids,
          payload,
          req,
        })
      }

      // /////////////////////////////////////
      // Delete documents
      // /////////////////////////////////////

      try {
        await payload.db.deleteMany({
          collection: collectionConfig.slug,
          req,
          where: {
            id: {
              in: ids,
            },
          },
        })
      } catch (error) {
        // A batched delete either lands for every id or for none, so it cannot be attributed to a
        // single document the way a per-document delete could.
        for (const { doc } of deletable) {
          pushError(doc.id, error)
        }

        return results
      }

      await Promise.all(
        deletable.map(async (entry) => {
          try {
            results[entry.index] = await runAfterDeleteWork(entry.doc)
          } catch (error) {
            pushError(entry.doc.id, error)
          }
        }),
      )

      return results
    }

    let awaitedDocs: (null | ResultDoc)[]

    if (req.payload.db.bulkOperationsSingleTransaction) {
      // Process sequentially so that each document's transaction is isolated from the next
      awaitedDocs = []

      for (const doc of docs) {
        awaitedDocs.push(await deleteDocumentIndividually(doc))
      }
    } else {
      awaitedDocs = await deleteDocumentsInBulk()
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
      docs: awaitedDocs.filter((doc): doc is ResultDoc => Boolean(doc)),
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
