import type { Config as GeneratedTypes } from 'payload/generated-types'

import httpStatus from 'http-status'

import type { AccessResult } from '../../config/types.js'
import type { PayloadRequest } from '../../express/types.js'
import type { Where } from '../../types/index.js'
import type { BeforeOperationHook, Collection } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { APIError } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
  collection: Collection
  depth?: number
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
  where: Where
}

async function deleteOperation<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments,
): Promise<{
  docs: GeneratedTypes['collections'][TSlug][]
  errors: {
    id: GeneratedTypes['collections'][TSlug]['id']
    message: string
  }[]
}> {
  let args = incomingArgs

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(
    async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
      await priorHook

      args =
        (await hook({
          args,
          context: args.req.context,
          operation: 'delete',
        })) || args
    },
    Promise.resolve(),
  )

  const {
    collection: { config: collectionConfig },
    depth,
    overrideAccess,
    req: {
      locale,
      payload: { config },
      payload,
      t,
    },
    req,
    showHiddenFields,
    where,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(
      async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
        await priorHook

        args =
          (await hook({
            args,
            context: req.context,
            operation: 'delete',
          })) || args
      },
      Promise.resolve(),
    )

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

    const { docs } = await payload.db.find<GeneratedTypes['collections'][TSlug]>({
      collection: collectionConfig.slug,
      locale,
      req,
      where: fullWhere,
    })

    const errors = []

    /* eslint-disable no-param-reassign */
    const promises = docs.map(async (doc) => {
      let result

      const { id } = doc

      try {
        // /////////////////////////////////////
        // beforeDelete - Collection
        // /////////////////////////////////////

        await collectionConfig.hooks.beforeDelete.reduce(async (priorHook, hook) => {
          await priorHook

          return hook({
            context: req.context,
            id,
            req,
          })
        }, Promise.resolve())

        await deleteAssociatedFiles({
          collectionConfig,
          config,
          doc,
          overrideDelete: true,
          t,
        })

        // /////////////////////////////////////
        // Delete document
        // /////////////////////////////////////

        await payload.db.deleteOne({
          collection: collectionConfig.slug,
          req,
          where: {
            id: {
              equals: id,
            },
          },
        })

        // /////////////////////////////////////
        // Delete versions
        // /////////////////////////////////////

        if (collectionConfig.versions) {
          await deleteCollectionVersions({
            id,
            payload,
            req,
            slug: collectionConfig.slug,
          })
        }

        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////

        result = await afterRead({
          context: req.context,
          depth,
          doc: result || doc,
          entityConfig: collectionConfig,
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
              context: req.context,
              doc: result,
              id,
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

    result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
      args,
      operation: 'delete',
      result,
    })

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default deleteOperation
