import type { FindOneArgs } from '../../database/types.js'
import type { CollectionSlug, JoinQuery } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { Collection, DataFromCollectionSlug } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { killTransaction } from '../../utilities/killTransaction.js'
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
  req: PayloadRequest
  showHiddenFields?: boolean
}

export const findByIDOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments,
): Promise<DataFromCollectionSlug<TSlug>> => {
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
      id,
      collection: { config: collectionConfig },
      currentDepth,
      depth,
      disableErrors,
      draft: draftEnabled = false,
      includeLockStatus,
      joins,
      overrideAccess = false,
      req: { fallbackLocale, locale, t },
      req,
      showHiddenFields,
    } = args

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResult = !overrideAccess
      ? await executeAccess(
          { id, disableErrors, operation: 'read', req },
          collectionConfig.access.read,
        )
      : true

    // If errors are disabled, and access returns false, return null
    if (accessResult === false) {
      return null
    }

    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      joins: req.payloadAPI === 'GraphQL' ? false : joins,
      locale,
      req: {
        transactionID: req.transactionID,
      } as PayloadRequest,
      where: combineQueries({ id: { equals: id } }, accessResult),
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
        const lockedDocument = await req.payload.find({
          collection: 'payload-locked-documents',
          depth: 1,
          limit: 1,
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
      })
    }

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
      await priorHook

      result =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          doc: result,
          query: findOneArgs.where,
          req,
        })) || result
    }, Promise.resolve())

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
          query: findOneArgs.where,
          req,
        })) || result
    }, Promise.resolve())

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

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
