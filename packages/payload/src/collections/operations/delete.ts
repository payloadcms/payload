import httpStatus from 'http-status'

import type { AccessResult } from '../../config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { BeforeOperationHook, Collection, DataFromCollectionSlug } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { APIError } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
  collection: Collection
  depth?: number
  overrideAccess?: boolean
  overrideLock?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
  where: Where
}

export const deleteOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments,
): Promise<{
  docs: DataFromCollectionSlug<TSlug>[]
  errors: {
    id: DataFromCollectionSlug<TSlug>['id']
    message: string
  }[]
}> => {
  let args = incomingArgs

  try {
    const shouldCommit = await initTransaction(args.req)
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(
      async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
        await priorHook

        args =
          (await hook({
            args,
            collection: args.collection.config,
            context: args.req.context,
            operation: 'delete',
            req: args.req,
          })) || args
      },
      Promise.resolve(),
    )

    const {
      collection: { config: collectionConfig },
      depth,
      overrideAccess,
      overrideLock,
      req: {
        fallbackLocale,
        locale,
        payload: { config },
        payload,
      },
      req,
      showHiddenFields,
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
      overrideAccess,
      req,
      where,
    })

    const fullWhere = combineQueries(where, accessResult)

    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////

    const dbArgs = {
      collection: collectionConfig.slug,
      locale,
      req,
      where: fullWhere,
    }
    let docs
    // @ts-expect-error exists
    if (collectionConfig?.db?.find) {
      // @ts-expect-error exists
      const result = await collectionConfig.db.find<DataFromCollectionSlug<TSlug>>(dbArgs)
      docs = result.docs
    } else {
      const result = await payload.db.find<DataFromCollectionSlug<TSlug>>(dbArgs)
      docs = result.docs
    }

    const errors = []

    const promises = docs.map(async (doc) => {
      let result

      const { id } = doc

      try {
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

        await collectionConfig.hooks.beforeDelete.reduce(async (priorHook, hook) => {
          await priorHook

          return hook({
            id,
            collection: collectionConfig,
            context: req.context,
            req,
          })
        }, Promise.resolve())

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
        // Delete document
        // /////////////////////////////////////

        const deleteOneArgs = {
          collection: collectionConfig.slug,
          req,
          where: {
            id: {
              equals: id,
            },
          },
        }
        // @ts-expect-error exists
        if (collectionConfig?.db?.deleteOne) {
          // @ts-expect-error exists
          await collectionConfig.db.deleteOne(deleteOneArgs)
        } else {
          await payload.db.deleteOne(deleteOneArgs)
        }

        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////

        result = await afterRead({
          collection: collectionConfig,
          context: req.context,
          depth,
          doc: result || doc,
          draft: undefined,
          fallbackLocale,
          global: null,
          locale,
          overrideAccess,
          req,
          showHiddenFields,
        })

        // /////////////////////////////////////
        // afterRead - Collection
        // /////////////////////////////////////

        await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
          await priorHook

          result =
            (await hook({
              collection: collectionConfig,
              context: req.context,
              doc: result || doc,
              req,
            })) || result
        }, Promise.resolve())

        // /////////////////////////////////////
        // afterDelete - Collection
        // /////////////////////////////////////

        await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
          await priorHook

          result =
            (await hook({
              id,
              collection: collectionConfig,
              context: req.context,
              doc: result,
              req,
            })) || result
        }, Promise.resolve())

        // /////////////////////////////////////
        // 8. Return results
        // /////////////////////////////////////

        return result
      } catch (error) {
        errors.push({
          id: doc.id,
          message: error.message,
        })
      }
      return null
    })

    const awaitedDocs = await Promise.all(promises)

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
