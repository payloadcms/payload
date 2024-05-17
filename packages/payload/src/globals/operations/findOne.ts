import type { AccessResult } from '../../config/types.js'
import type { PayloadRequestWithData, Populate, Select, Where } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import replaceWithDraftIfAvailable from '../../versions/drafts/replaceWithDraftIfAvailable.js'

type Args = {
  depth?: number
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  overrideAccess?: boolean
  populate?: Populate
  req: PayloadRequestWithData
  select?: Select
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
    overrideAccess = false,
    populate,
    req: { fallbackLocale, locale },
    req,
    select,
    showHiddenFields,
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
      slug,
      locale,
      req,
      select,
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
      draft: draftEnabled,
      fallbackLocale,
      global: globalConfig,
      locale,
      overrideAccess,
      populateArg: populate,
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
