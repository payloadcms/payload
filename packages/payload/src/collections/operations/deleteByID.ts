import type { GeneratedTypes } from '../../'
import type { PayloadRequest } from '../../express/types'
import type { Document } from '../../types'
import type { BeforeOperationHook, Collection } from '../config/types'

import executeAccess from '../../auth/executeAccess'
import { hasWhereAccessResult } from '../../auth/types'
import { combineQueries } from '../../database/combineQueries'
import { Forbidden, NotFound } from '../../errors'
import { afterRead } from '../../fields/hooks/afterRead'
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions'
import { buildAfterOperation } from './utils'

export type Arguments = {
  collection: Collection
  depth?: number
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

async function deleteByID<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments,
): Promise<Document> {
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
      id,
      collection: { config: collectionConfig },
      depth,
      overrideAccess,
      req: {
        fallbackLocale,
        locale,
        payload: { config },
        payload,
        t,
      },
      req,
      showHiddenFields,
    } = args

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, req }, collectionConfig.access.delete)
      : true
    const hasWhereAccess = hasWhereAccessResult(accessResults)

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

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////
    let docToDelete: Document
    const dbArgs = {
      collection: collectionConfig.slug,
      locale: req.locale,
      req,
      where: combineQueries({ id: { equals: id } }, accessResults),
    }

    if (collectionConfig?.db?.findOne) {
      docToDelete = await collectionConfig.db.findOne(dbArgs)
    } else {
      docToDelete = await req.payload.db.findOne(dbArgs)
    }

    if (!docToDelete && !hasWhereAccess) throw new NotFound(t)
    if (!docToDelete && hasWhereAccess) throw new Forbidden(t)

    await deleteAssociatedFiles({
      collectionConfig,
      config,
      doc: docToDelete,
      overrideDelete: true,
      t,
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

    let result
    const deleteOneArgs = {
      collection: collectionConfig.slug,
      req,
      where: { id: { equals: id } },
    }
    if (collectionConfig?.db?.deleteOne) {
      result = await collectionConfig?.db.deleteOne(deleteOneArgs)
    } else {
      result = await payload.db.deleteOne(deleteOneArgs)
    }

    // /////////////////////////////////////
    // Delete Preferences
    // /////////////////////////////////////

    await deleteUserPreferences({
      collectionConfig,
      ids: [id],
      payload,
      req,
    })

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth,
      doc: result,
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
          doc: result,
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
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
      args,
      collection: collectionConfig,
      operation: 'deleteByID',
      result,
    })

    // /////////////////////////////////////
    // 8. Return results
    // /////////////////////////////////////

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

export default deleteByID
