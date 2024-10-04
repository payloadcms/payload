import type { PayloadRequest } from '../../types/index.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'

export type Arguments = {
  depth?: number
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  id: number | string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
}

export const restoreVersionOperation = async <T extends TypeWithVersion<T> = any>(
  args: Arguments,
): Promise<T> => {
  const {
    id,
    depth,
    draft,
    globalConfig,
    overrideAccess,
    req: { fallbackLocale, locale, payload },
    req,
    showHiddenFields,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      await executeAccess({ req }, globalConfig.access.update)
    }

    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////

    const findGlobalDbArgs = {
      global: globalConfig.slug,
      limit: 1,
      req,
      where: { id: { equals: id } },
    }
    let findGlobalResult: any
    // @ts-expect-error exists
    if (globalConfig?.db?.findGlobalVersions) {
      // @ts-expect-error exists
      findGlobalResult = await globalConfig.db.findGlobalVersions<any>(findGlobalDbArgs)
    } else {
      findGlobalResult = await payload.db.findGlobalVersions<any>(findGlobalDbArgs)
    }
    const versionDocs = findGlobalResult.docs

    if (!versionDocs || versionDocs.length === 0) {
      throw new NotFound(req.t)
    }

    const rawVersion = versionDocs[0]

    // Patch globalType onto version doc
    rawVersion.version.globalType = globalConfig.slug

    // Overwrite draft status if draft is true

    if (draft) {
      rawVersion.version._status = 'draft'
    }
    // /////////////////////////////////////
    // fetch previousDoc
    // /////////////////////////////////////

    const previousDoc = await payload.findGlobal({
      slug: globalConfig.slug,
      depth,
      req,
    })

    // /////////////////////////////////////
    // Update global
    // /////////////////////////////////////

    let global: any
    // @ts-expect-error exists
    if (globalConfig?.db?.findGlobal) {
      // @ts-expect-error exists
      global = await globalConfig.db.findGlobal({
        slug: globalConfig.slug,
        req,
      })
    } else {
      global = await payload.db.findGlobal({
        slug: globalConfig.slug,
        req,
      })
    }

    let result = rawVersion.version

    const globalDbArgs = {
      slug: globalConfig.slug,
      data: result,
      req,
    }
    if (global) {
      // @ts-expect-error exists
      if (globalConfig?.db?.updateGlobal) {
        // @ts-expect-error exists
        result = await globalConfig.db.updateGlobal(globalDbArgs)
      } else {
        result = await payload.db.updateGlobal(globalDbArgs)
      }

      const now = new Date().toISOString()

      // @ts-expect-error exists
      if (globalConfig?.db?.createGlobalVersion) {
        // @ts-expect-error exists
        result = await globalConfig.db.createGlobalVersion({
          autosave: false,
          createdAt: result.createdAt ? new Date(result.createdAt).toISOString() : now,
          globalSlug: globalConfig.slug,
          parent: id,
          req,
          updatedAt: draft ? now : new Date(result.updatedAt).toISOString(),
          versionData: result,
        })
      } else {
        result = await payload.db.createGlobalVersion({
          autosave: false,
          createdAt: result.createdAt ? new Date(result.createdAt).toISOString() : now,
          globalSlug: globalConfig.slug,
          parent: id,
          req,
          updatedAt: draft ? now : new Date(result.updatedAt).toISOString(),
          versionData: result,
        })
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

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: null,
      context: req.context,
      depth,
      doc: result,
      draft: undefined,
      fallbackLocale,
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
      data: result,
      doc: result,
      global: globalConfig,
      operation: 'update',
      previousDoc,
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
          previousDoc,
          req,
        })) || result
    }, Promise.resolve())

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
