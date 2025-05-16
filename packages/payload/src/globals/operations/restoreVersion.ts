// @ts-strict-ignore
import type { PayloadRequest, PopulateType } from '../../types/index.js'
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
  populate?: PopulateType
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
    populate,
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

    const { docs: versionDocs } = await payload.db.findGlobalVersions<any>({
      global: globalConfig.slug,
      limit: 1,
      req,
      where: { id: { equals: id } },
    })

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

    const global = await payload.db.findGlobal({
      slug: globalConfig.slug,
      req,
    })

    let result = rawVersion.version

    if (global) {
      result = await payload.db.updateGlobal({
        slug: globalConfig.slug,
        data: result,
        req,
      })

      const now = new Date().toISOString()

      result = await payload.db.createGlobalVersion({
        autosave: false,
        createdAt: result.createdAt ? new Date(result.createdAt).toISOString() : now,
        globalSlug: globalConfig.slug,
        parent: id,
        req,
        updatedAt: draft ? now : new Date(result.updatedAt).toISOString(),
        versionData: result,
      })
    } else {
      result = await payload.db.createGlobal({
        slug: globalConfig.slug,
        data: result,
        req,
      })
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
      populate,
      req,
      showHiddenFields,
    })

    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.afterRead?.length) {
      for (const hook of globalConfig.hooks.afterRead) {
        result =
          (await hook({
            context: req.context,
            doc: result,
            global: globalConfig,
            req,
          })) || result
      }
    }

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

    if (globalConfig.hooks?.afterChange?.length) {
      for (const hook of globalConfig.hooks.afterChange) {
        result =
          (await hook({
            context: req.context,
            doc: result,
            global: globalConfig,
            previousDoc,
            req,
          })) || result
      }
    }

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
