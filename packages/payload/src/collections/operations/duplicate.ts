import type { DeepPartial } from 'ts-essentials'

import httpStatus from 'http-status'

import type { FindOneArgs } from '../../database/types.js'
import type { GeneratedTypes } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'
import { saveVersion } from '../../versions/saveVersion.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
  collection: Collection
  depth?: number
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

export const duplicateOperation = async <TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments,
): Promise<GeneratedTypes['collections'][TSlug]> => {
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
          operation: 'update',
          req: args.req,
        })) || args
    }, Promise.resolve())

    const {
      id,
      collection: { config: collectionConfig },
      depth,
      draft: draftArg = true,
      overrideAccess,
      req: {
        fallbackLocale,
        payload: { config },
        payload,
      },
      req,
      showHiddenFields,
    } = args

    if (!id) {
      throw new APIError('Missing ID of document to duplicate.', httpStatus.BAD_REQUEST)
    }
    const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts)

    // TODO: what to do about user collections?

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    // TODO: which access control should be used?
    const accessResults = !overrideAccess
      ? await executeAccess({ id, req }, collectionConfig.access.read)
      : true
    const hasWherePolicy = hasWhereAccessResult(accessResults)

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////
    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      locale: req.locale,
      req,
      where: combineQueries(
        { id: { equals: id } },
        accessResults
      ),
    }

    const docWithLocales = await getLatestCollectionVersion({
      id,
      config: collectionConfig,
      payload,
      query: findOneArgs,
      req,
    })

    if (!docWithLocales && !hasWherePolicy) throw new NotFound(req.t)
    if (!docWithLocales && hasWherePolicy) throw new Forbidden(req.t)

    // remove the createdAt timestamp and rely on the db to default it
    delete docWithLocales.createdAt

    // for version enabled collections, override the current status with draft, unless draft is explicitly set to false
    if (shouldSaveDraft) {
      docWithLocales._status = 'draft'
    }

    let locales = [undefined]
    let versionDoc

    if (config.localization) {
      locales = config.localization.locales.map(({ code }) => code)
    }

    await locales.reduce(async (previousPromise, locale: string | undefined, i) => {
      await previousPromise
      const operation = i === 0 ? 'create' : 'update'

      const originalDoc = await afterRead({
        collection: collectionConfig,
        context: req.context,
        depth: 0,
        doc: docWithLocales,
        fallbackLocale: null,
        global: null,
        locale,
        overrideAccess: true,
        req,
        showHiddenFields: true,
      })

      // /////////////////////////////////////
      // beforeValidate - Fields
      // /////////////////////////////////////

      let data = await beforeValidate<DeepPartial<GeneratedTypes['collections'][TSlug]>>({
        id,
        collection: collectionConfig,
        context: req.context,
        data: originalDoc,
        doc: originalDoc,
        duplicate: true,
        global: null,
        operation,
        overrideAccess,
        req,
      })

      // /////////////////////////////////////
      // beforeValidate - Collection
      // /////////////////////////////////////

      await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
        await priorHook

        data =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            data,
            operation,
            originalDoc,
            req,
          })) || data
      }, Promise.resolve())

      // /////////////////////////////////////
      // beforeChange - Collection
      // /////////////////////////////////////

      await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
        await priorHook

        data =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            data,
            operation,
            originalDoc,
            req,
          })) || data
      }, Promise.resolve())

      // /////////////////////////////////////
      // beforeChange - Fields
      // /////////////////////////////////////

      const result = await beforeChange<GeneratedTypes['collections'][TSlug]>({
        id,
        collection: collectionConfig,
        context: req.context,
        data,
        doc: originalDoc,
        docWithLocales,
        global: null,
        operation,
        req,
        skipValidation: shouldSaveDraft,
      })

      // /////////////////////////////////////
      // Handle potential password update
      // /////////////////////////////////////

      // const dataToUpdate: Record<string, unknown> = { ...result }

      // if (shouldSavePassword && typeof password === 'string') {
      //   const { hash, salt } = await generatePasswordSaltHash({ password })
      //   dataToUpdate.salt = salt
      //   dataToUpdate.hash = hash
      //   delete dataToUpdate.password
      //   delete data.password
      // }

      // /////////////////////////////////////
      // Create / Update
      // /////////////////////////////////////

      if (i === 0) {
        versionDoc = await payload.db.create({
          collection: collectionConfig.slug,
          data: result,
          req,
        })
      } else {
        versionDoc = await req.payload.db.updateOne({
          id: versionDoc.id,
          collection: collectionConfig.slug,
          data: result,
          locale,
          req,
        })
      }
    }, Promise.resolve())

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////

    let result = versionDoc
    if (collectionConfig.versions) {
      result = await saveVersion({
        id: versionDoc.id,
        collection: collectionConfig,
        docWithLocales: {
          ...versionDoc,
          createdAt: docWithLocales.createdAt,
        },
        draft: shouldSaveDraft,
        payload,
        req,
      })
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth,
      doc: versionDoc,
      fallbackLocale,
      global: null,
      locale: req.locale,
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
    // afterChange - Fields
    // /////////////////////////////////////

    result = await afterChange<GeneratedTypes['collections'][TSlug]>({
      collection: collectionConfig,
      context: req.context,
      data: versionDoc,
      doc: result,
      global: null,
      operation: 'create',
      previousDoc: {},
      req,
    })

    // /////////////////////////////////////
    // afterChange - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
      await priorHook

      result =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          doc: result,
          operation: 'create',
          previousDoc: {},
          req,
        })) || result
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
      args,
      collection: collectionConfig,
      operation: 'create',
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
