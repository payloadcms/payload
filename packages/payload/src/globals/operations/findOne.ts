import type { AccessResult } from '../../config/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import replaceWithDraftIfAvailable from '../../versions/drafts/replaceWithDraftIfAvailable.js'

type Args = {
  depth?: number
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  includeLockStatus?: boolean
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
  slug: string
}

export const findOneOperation = async <T extends Record<string, unknown>>(
  args: Args,
): Promise<T> => {
  const {
    slug,
    depth,
    draft: draftEnabled = false,
    globalConfig,
    includeLockStatus,
    overrideAccess = false,
    req: { fallbackLocale, locale },
    req,
    showHiddenFields,
  } = args

  try {
    // /////////////////////////////////////
    // Retrieve and execute access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ operation: 'read', req }, globalConfig.access.read)
    }

    // /////////////////////////////////////
    // Perform database operation
    // /////////////////////////////////////

    let doc = await req.payload.db.findGlobal({
      slug,
      locale,
      req,
      where: overrideAccess ? undefined : (accessResult as Where),
    })
    if (!doc) {
      doc = {}
    }

    // /////////////////////////////////////
    // Include Lock Status if required
    // /////////////////////////////////////

    if (includeLockStatus && slug) {
      let lockStatus = null

      try {
        const lockedDocument = await req.payload.find({
          collection: 'payload-locked-documents',
          depth: 1,
          limit: 1,
          pagination: false,
          req,
          where: {
            globalSlug: {
              equals: slug,
            },
          },
        })

        if (lockedDocument && lockedDocument.docs.length > 0) {
          lockStatus = lockedDocument.docs[0]
        }
      } catch {
        // swallow error
      }

      doc._isLocked = !!lockStatus
      doc._userEditing = lockStatus?.user?.value ?? null
    }

    // /////////////////////////////////////
    // Replace document with draft if available
    // /////////////////////////////////////

    if (globalConfig.versions?.drafts && draftEnabled) {
      doc = await replaceWithDraftIfAvailable({
        accessResult,
        doc,
        entity: globalConfig,
        entityType: 'global',
        overrideAccess,
        req,
      })
    }

    // /////////////////////////////////////
    // Execute before global hook
    // /////////////////////////////////////

    await globalConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
      await priorHook

      doc =
        (await hook({
          context: req.context,
          doc,
          global: globalConfig,
          req,
        })) || doc
    }, Promise.resolve())

    // /////////////////////////////////////
    // Execute field-level hooks and access
    // /////////////////////////////////////

    doc = await afterRead({
      collection: null,
      context: req.context,
      depth,
      doc,
      draft: draftEnabled,
      fallbackLocale,
      global: globalConfig,
      locale,
      overrideAccess,
      req,
      showHiddenFields,
    })

    // /////////////////////////////////////
    // Execute after global hook
    // /////////////////////////////////////

    await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook

      doc =
        (await hook({
          context: req.context,
          doc,
          global: globalConfig,
          req,
        })) || doc
    }, Promise.resolve())

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return doc
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
