import type { DeepPartial } from 'ts-essentials'

import type { GlobalSlug, JsonObject } from '../../index.js'
import type { Operation, PayloadRequest, Where } from '../../types/index.js'
import type { DataFromGlobalSlug, SanitizedGlobalConfig } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple } from '../../index.js'
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getLatestGlobalVersion } from '../../versions/getLatestGlobalVersion.js'
import { saveVersion } from '../../versions/saveVersion.js'

type Args<TSlug extends GlobalSlug> = {
  autosave?: boolean
  data: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  depth?: number
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  overrideAccess?: boolean
  overrideLock?: boolean
  publishSpecificLocale?: string
  req: PayloadRequest
  showHiddenFields?: boolean
  slug: string
}

export const updateOperation = async <TSlug extends GlobalSlug>(
  args: Args<TSlug>,
): Promise<DataFromGlobalSlug<TSlug>> => {
  if (args.publishSpecificLocale) {
    args.req.locale = args.publishSpecificLocale
  }

  const {
    slug,
    autosave,
    depth,
    draft: draftArg,
    globalConfig,
    overrideAccess,
    overrideLock,
    publishSpecificLocale,
    req: { fallbackLocale, locale, payload },
    req,
    showHiddenFields,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    let { data } = args

    const shouldSaveDraft = Boolean(draftArg && globalConfig.versions?.drafts)

    // /////////////////////////////////////
    // 1. Retrieve and execute access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess(
          {
            data,
            req,
          },
          globalConfig.access.update,
        )
      : true

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////

    const query: Where = overrideAccess ? undefined : (accessResults as Where)

    // /////////////////////////////////////
    // 2. Retrieve document
    // /////////////////////////////////////
    const globalVersion = await getLatestGlobalVersion({
      slug,
      config: globalConfig,
      locale,
      payload,
      req,
      where: query,
    })
    const { global, globalExists } = globalVersion || {}

    let globalJSON: JsonObject = {}

    if (globalVersion && globalVersion.global) {
      globalJSON = deepCopyObjectSimple(global)

      if (globalJSON._id) {
        delete globalJSON._id
      }
    }

    const originalDoc = await afterRead({
      collection: null,
      context: req.context,
      depth: 0,
      doc: globalJSON,
      draft: draftArg,
      fallbackLocale,
      global: globalConfig,
      locale,
      overrideAccess: true,
      req,
      showHiddenFields,
    })

    // ///////////////////////////////////////////
    // Handle potentially locked global documents
    // ///////////////////////////////////////////

    await checkDocumentLockStatus({
      globalSlug: slug,
      lockErrorMessage: `Global with slug "${slug}" is currently locked by another user and cannot be updated.`,
      overrideLock,
      req,
    })

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    data = await beforeValidate({
      collection: null,
      context: req.context,
      data,
      doc: originalDoc,
      global: globalConfig,
      operation: 'update',
      overrideAccess,
      req,
    })

    // /////////////////////////////////////
    // beforeValidate - Global
    // /////////////////////////////////////

    await globalConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
      await priorHook

      data =
        (await hook({
          context: req.context,
          data,
          global: globalConfig,
          originalDoc,
          req,
        })) || data
    }, Promise.resolve())

    // /////////////////////////////////////
    // beforeChange - Global
    // /////////////////////////////////////

    await globalConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
      await priorHook

      data =
        (await hook({
          context: req.context,
          data,
          global: globalConfig,
          originalDoc,
          req,
        })) || data
    }, Promise.resolve())

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////
    let publishedDocWithLocales = globalJSON
    let versionSnapshotResult

    const beforeChangeArgs = {
      collection: null,
      context: req.context,
      data,
      doc: originalDoc,
      docWithLocales: undefined,
      global: globalConfig,
      operation: 'update' as Operation,
      req,
      skipValidation:
        shouldSaveDraft && globalConfig.versions.drafts && !globalConfig.versions.drafts.validate,
    }

    if (publishSpecificLocale) {
      const latestVersion = await getLatestGlobalVersion({
        slug,
        config: globalConfig,
        payload,
        published: true,
        req,
        where: query,
      })

      publishedDocWithLocales = latestVersion?.global || {}

      versionSnapshotResult = await beforeChange({
        ...beforeChangeArgs,
        docWithLocales: globalJSON,
      })
    }

    let result = await beforeChange({
      ...beforeChangeArgs,
      docWithLocales: publishedDocWithLocales,
    })

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    if (!shouldSaveDraft) {
      const globalDbArgs = {
        slug,
        data: result,
        req,
      }
      if (globalExists) {
        // @ts-expect-error exists
        if (globalConfig?.db?.updateGlobal) {
          // @ts-expect-error exists
          result = await globalConfig.db.updateGlobal(globalDbArgs)
        } else {
          result = await payload.db.updateGlobal(globalDbArgs)
        }
      } else {
        // @ts-expect-error exists
        if (globalConfig?.db?.createGlobal) {
          // @ts-expect-error exists
          result = await globalConfig.db.createGlobal(globalDbArgs)
        } else {
          result = await payload.db.createGlobal(globalDbArgs)
        }
      }
    }

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////
    if (globalConfig.versions) {
      const { globalType } = result
      result = await saveVersion({
        autosave,
        docWithLocales: {
          ...result,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
        draft: shouldSaveDraft,
        global: globalConfig,
        payload,
        publishSpecificLocale,
        req,
        snapshot: versionSnapshotResult,
      })

      result = {
        ...result,
        globalType,
      }
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: null,
      context: req.context,
      depth,
      doc: result,
      draft: draftArg,
      fallbackLocale: null,
      global: globalConfig,
      locale,
      overrideAccess,
      req,
      showHiddenFields,
    })

    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////

    await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook

      result =
        (await hook({
          context: req.context,
          doc: result,
          global: globalConfig,
          req,
        })) || result
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterChange - Fields
    // /////////////////////////////////////

    result = await afterChange({
      collection: null,
      context: req.context,
      data,
      doc: result,
      global: globalConfig,
      operation: 'update',
      previousDoc: originalDoc,
      req,
    })

    // /////////////////////////////////////
    // afterChange - Global
    // /////////////////////////////////////

    await globalConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
      await priorHook

      result =
        (await hook({
          context: req.context,
          doc: result,
          global: globalConfig,
          previousDoc: originalDoc,
          req,
        })) || result
    }, Promise.resolve())

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
