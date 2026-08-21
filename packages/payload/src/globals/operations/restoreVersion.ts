import type { PayloadRequest, PopulateType } from '../../types/index.js'
import type { RestoreAction } from '../../versions/actions/types.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import {
  canonicalizeWriteStatus,
  requestedActionFromLegacyDraft,
  resolveAction,
} from '../../versions/actions/resolveAction.js'

export type Arguments = {
  action?: RestoreAction
  depth?: number
  /**
   * Leftover REST/GraphQL boolean until those transports are converted.
   */
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  id: number | string
  overrideAccess?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  showHiddenFields?: boolean
}

export const restoreVersionOperation = async <T extends TypeWithVersion<T> = any>(
  incomingArgs: Arguments,
): Promise<T> => {
  let args = incomingArgs
  const req = args.req!

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // beforeOperation - Global
    // /////////////////////////////////////

    if (args.globalConfig.hooks?.beforeOperation?.length) {
      for (const hook of args.globalConfig.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            context: req.context,
            global: args.globalConfig,
            operation: 'restoreVersion',
            overrideAccess: args.overrideAccess,
            req,
          })) || args
      }
    }

    const { id, action, depth, draft, globalConfig, overrideAccess, populate, showHiddenFields } =
      args
    const { fallbackLocale, locale, payload } = req

    const resolvedAction = resolveAction({
      action: requestedActionFromLegacyDraft({ action, draft }),
      draftsEnabled: hasDraftsEnabled(globalConfig),
      locale,
      operation: 'restore',
    })
    const isSavingDraft = resolvedAction === 'saveDraft'
    const readVersion = isSavingDraft ? 'latest' : 'published'

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      await executeAccess({ slug: globalConfig.slug, req }, globalConfig.access.update)
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

    const rawVersion = versionDocs[0]!

    // Patch globalType onto version doc
    rawVersion.version.globalType = globalConfig.slug
    rawVersion.version = canonicalizeWriteStatus({
      action: resolvedAction,
      data: rawVersion.version,
      locale,
    })

    // /////////////////////////////////////
    // fetch previousDoc
    // /////////////////////////////////////

    const previousDoc = await payload.findGlobal({
      slug: globalConfig.slug,
      depth,
      req,
    })

    req.context.isRestoringVersion = true

    // /////////////////////////////////////
    // Update global
    // /////////////////////////////////////

    const existingGlobal = await payload.db.findGlobal({
      slug: globalConfig.slug,
      req,
    })

    let result = rawVersion.version
    result.updatedAt = new Date().toISOString()

    if (!isSavingDraft) {
      if (existingGlobal) {
        result = await payload.db.updateGlobal({
          slug: globalConfig.slug,
          data: result,
          req,
        })
      } else {
        result = await payload.db.createGlobal({
          slug: globalConfig.slug,
          data: result,
          req,
        })
      }
    }

    const now = new Date().toISOString()

    result = await payload.db.createGlobalVersion({
      autosave: false,
      createdAt: result.createdAt ? new Date(result.createdAt).toISOString() : now,
      globalSlug: globalConfig.slug,
      req,
      updatedAt: isSavingDraft ? now : new Date(result.updatedAt).toISOString(),
      versionData: result,
    })

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: null,
      context: req.context,
      depth: depth!,
      doc: result,
      fallbackLocale: fallbackLocale!,
      global: globalConfig,
      locale: locale!,
      overrideAccess: overrideAccess!,
      populate,
      req,
      showHiddenFields: showHiddenFields!,
      version: readVersion,
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
            overrideAccess,
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
            data: result,
            doc: result,
            global: globalConfig,
            overrideAccess,
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
