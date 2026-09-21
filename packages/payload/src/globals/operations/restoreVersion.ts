import type { PayloadRequest, PopulateType, Where } from '../../types/index.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { Forbidden, NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getRestoredStatusesToAuthorize } from '../../versions/getRestoredStatusesToAuthorize.js'

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
  const { id, depth, draft, globalConfig, overrideAccess, populate, showHiddenFields } = args
  const req = args.req!
  const { fallbackLocale, locale, payload } = req

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // beforeOperation - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.beforeOperation?.length) {
      for (const hook of globalConfig.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            context: req.context,
            global: globalConfig,
            operation: 'restoreVersion',
            overrideAccess,
            req,
          })) || args
      }
    }

    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////

    // The selected version must satisfy read-version access.
    const readVersionsAccessResult = overrideAccess
      ? true
      : await executeAccess({ slug: globalConfig.slug, req }, globalConfig.access.readVersions)

    const { docs: versionDocs } = await payload.db.findGlobalVersions<any>({
      global: globalConfig.slug,
      limit: 1,
      req,
      where: combineQueries({ id: { equals: id } }, readVersionsAccessResult),
    })

    if (!versionDocs || versionDocs.length === 0) {
      if (hasWhereAccessResult(readVersionsAccessResult)) {
        throw new Forbidden(req.t)
      }
      throw new NotFound(req.t)
    }

    const rawVersion = versionDocs[0]!

    // Patch globalType onto version doc
    rawVersion.version.globalType = globalConfig.slug

    // Overwrite draft status if draft is true
    if (draft) {
      rawVersion.version._status = 'draft'
    }

    // A localized `_status` can publish and unpublish locales in one restore, so authorize every
    // status it writes. executeAccess throws Forbidden on the first denial.
    const restoredStatuses = getRestoredStatusesToAuthorize(rawVersion.version._status)

    const updateAccessResults: Array<boolean | Where> = []

    if (overrideAccess) {
      updateAccessResults.push(true)
    } else {
      const statusesToAuthorize = restoredStatuses.length > 0 ? restoredStatuses : [undefined]

      for (const status of statusesToAuthorize) {
        updateAccessResults.push(
          await executeAccess(
            {
              slug: globalConfig.slug,
              data: { _status: status },
              req,
            },
            globalConfig.access.update,
          ),
        )
      }
    }

    // /////////////////////////////////////
    // fetch previousDoc
    // /////////////////////////////////////

    const previousDoc = await payload.findGlobal({
      slug: globalConfig.slug,
      depth,
      overrideAccess: true,
      req,
    })

    req.context.isRestoringVersion = true

    // /////////////////////////////////////
    // Update global
    // /////////////////////////////////////

    for (const updateAccessResult of updateAccessResults) {
      if (!hasWhereAccessResult(updateAccessResult)) {
        continue
      }

      const constrainedGlobal = await payload.db.findGlobal({
        slug: globalConfig.slug,
        req,
        where: updateAccessResult,
      })

      if (!constrainedGlobal || Object.keys(constrainedGlobal).length === 0) {
        throw new Forbidden(req.t)
      }
    }

    const global = await payload.db.findGlobal({
      slug: globalConfig.slug,
      req,
    })

    let result = rawVersion.version

    if (global) {
      // Ensure updatedAt date is always updated
      result.updatedAt = new Date().toISOString()
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
      depth: depth!,
      doc: result,
      draft: undefined!,
      fallbackLocale: fallbackLocale!,
      global: globalConfig,
      locale: locale!,
      overrideAccess: overrideAccess!,
      populate,
      req,
      showHiddenFields: showHiddenFields!,
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
