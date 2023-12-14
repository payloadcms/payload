import type { AccessResult } from '../../config/types'
import type { PayloadRequest } from '../../types'
import type { Where } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import executeAccess from '../../auth/executeAccess'
import { afterRead } from '../../fields/hooks/afterRead'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import replaceWithDraftIfAvailable from '../../versions/drafts/replaceWithDraftIfAvailable'

type Args = {
  depth?: number
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  locale?: string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
  slug: string
}

async function findOne<T extends Record<string, unknown>>(args: Args): Promise<T> {
  const {
    depth,
    draft: draftEnabled = false,
    globalConfig,
    overrideAccess = false,
    req: { locale },
    req,
    showHiddenFields,
    slug,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // Retrieve and execute access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ req }, globalConfig.access.read)
    }

    // /////////////////////////////////////
    // Perform database operation
    // /////////////////////////////////////

    let doc = await req.payload.db.findGlobal({
      locale,
      req,
      slug,
      where: overrideAccess ? undefined : (accessResult as Where),
    })
    if (!doc) {
      doc = {}
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
      global: globalConfig,
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

    if (shouldCommit) await commitTransaction(req)

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return doc
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default findOne
