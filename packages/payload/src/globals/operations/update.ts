import type { DeepPartial } from 'ts-essentials'

import type { GeneratedTypes } from '../../'
import type { PayloadRequest } from '../../express/types'
import type { Where } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import executeAccess from '../../auth/executeAccess'
import { afterChange } from '../../fields/hooks/afterChange'
import { afterRead } from '../../fields/hooks/afterRead'
import { beforeChange } from '../../fields/hooks/beforeChange'
import { beforeValidate } from '../../fields/hooks/beforeValidate'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { getLatestGlobalVersion } from '../../versions/getLatestGlobalVersion'
import { saveVersion } from '../../versions/saveVersion'

type Args<T extends { [field: number | string | symbol]: unknown }> = {
  autosave?: boolean
  data: DeepPartial<Omit<T, 'id'>>
  depth?: number
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
  slug: string
}

async function update<TSlug extends keyof GeneratedTypes['globals']>(
  args: Args<GeneratedTypes['globals'][TSlug]>,
): Promise<GeneratedTypes['globals'][TSlug]> {
  const {
    slug,
    autosave,
    depth,
    draft: draftArg,
    globalConfig,
    overrideAccess,
    req: { fallbackLocale, locale, payload },
    req,
    showHiddenFields,
  } = args

  try {
    const isCustomGlobalDb = Boolean(
      globalConfig?.db?.updateGlobal || globalConfig?.db?.createGlobal,
    )

    const shouldCommit = !isCustomGlobalDb && (await initTransaction(req))

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
    const { global, globalExists } = await getLatestGlobalVersion({
      slug,
      config: globalConfig,
      locale,
      payload,
      req,
      where: query,
    })

    let globalJSON: Record<string, unknown> = {}

    if (global) {
      globalJSON = JSON.parse(JSON.stringify(global))

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

    let result = await beforeChange({
      collection: null,
      context: req.context,
      data,
      doc: originalDoc,
      docWithLocales: globalJSON,
      global: globalConfig,
      operation: 'update',
      req,
      skipValidation:
        shouldSaveDraft && globalConfig.versions.drafts && !globalConfig.versions.drafts.validate,
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
        if (globalConfig?.db?.updateGlobal) {
          result = await globalConfig.db.updateGlobal(globalDbArgs)
        } else {
          result = await payload.db.updateGlobal(globalDbArgs)
        }
      } else {
        if (globalConfig?.db?.createGlobal) {
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
        req,
      })
      result.globalType = globalType
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

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default update
