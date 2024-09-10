import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { BeforeOperationHook, Collection, DataFromCollectionSlug } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
  collection: Collection
  depth?: number
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

export const deleteByIDOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments,
): Promise<DataFromCollectionSlug<TSlug>> => {
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

    const docToDelete = await req.payload.db.findOne({
      collection: collectionConfig.slug,
      locale: req.locale,
      req,
      where: combineQueries({ id: { equals: id } }, accessResults),
    })

    if (!docToDelete && !hasWhereAccess) {
      throw new NotFound(req.t)
    }
    if (!docToDelete && hasWhereAccess) {
      throw new Forbidden(req.t)
    }

    // Check if the document is locked
    const lockStatus = await payload.find({
      collection: 'payload-locked-documents',
      depth: 1,
      limit: 1,
      pagination: false,
      req,
      where: {
        'document.relationTo': {
          equals: collectionConfig.slug,
        },
        'document.value': {
          equals: id,
        },
      },
    })

    let shouldUnlockDocument = false

    if (lockStatus.docs.length > 0) {
      const lockedDoc = lockStatus.docs[0]
      const lastEditedAt = new Date(lockedDoc?._lastEdited?.editedAt)
      const now = new Date()

      const lockWhenEditingProp =
        collectionConfig?.lockWhenEditing !== undefined ? collectionConfig?.lockWhenEditing : true

      const lockDuration =
        typeof lockWhenEditingProp === 'object' && 'lockDuration' in lockWhenEditingProp
          ? lockWhenEditingProp.lockDuration
          : 300 // 5 minutes in seconds

      const lockDurationInMilliseconds = lockDuration * 1000
      const currentUserId = req.user?.id

      if (lockedDoc._lastEdited?.user?.value?.id !== currentUserId) {
        // Document is locked by another user and the lock has not expired, skip deletion
        if (now.getTime() - lastEditedAt.getTime() <= lockDurationInMilliseconds) {
          throw new APIError(`Document with ID ${id} is currently locked and cannot be deleted.`)
        } else {
          // Lock has expired, proceed and unlock later
          shouldUnlockDocument = true
        }
      } else {
        // Document is locked by the current user, proceed and unlock later
        shouldUnlockDocument = true
      }
    }

    await deleteAssociatedFiles({
      collectionConfig,
      config,
      doc: docToDelete,
      overrideDelete: true,
      req,
    })

    // /////////////////////////////////////
    // Unlock the document if necessary
    // /////////////////////////////////////

    if (shouldUnlockDocument && lockStatus.docs.length > 0) {
      await payload.db.deleteOne({
        collection: 'payload-locked-documents',
        req,
        where: {
          id: { equals: lockStatus.docs[0].id },
        },
      })
    }

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

    let result: DataFromCollectionSlug<TSlug> = await req.payload.db.deleteOne({
      collection: collectionConfig.slug,
      req,
      where: { id: { equals: id } },
    })

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

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'deleteByID',
      result,
    })

    // /////////////////////////////////////
    // 8. Return results
    // /////////////////////////////////////

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
