// @ts-strict-ignore
import type { AccessResult } from '../../config/types.js'
import type { PayloadRequest, PopulateType, SelectType, Where } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { lockedDocumentsCollectionSlug } from '../../locked-documents/config.js'
import { getSelectMode } from '../../utilities/getSelectMode.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import replaceWithDraftIfAvailable from '../../versions/drafts/replaceWithDraftIfAvailable.js'

type Args = {
  depth?: number
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  includeLockStatus?: boolean
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  select?: SelectType
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
    populate,
    req: { fallbackLocale, locale },
    req,
    select: incomingSelect,
    showHiddenFields,
  } = args

  try {
    // /////////////////////////////////////
    // Retrieve and execute access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ req }, globalConfig.access.read)
    }

    const select = sanitizeSelect({
      forceSelect: globalConfig.forceSelect,
      select: incomingSelect,
    })

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
    // Include Lock Status if required
    // /////////////////////////////////////
    if (includeLockStatus && slug) {
      let lockStatus = null

      try {
        const lockDocumentsProp = globalConfig?.lockDocuments

        const lockDurationDefault = 300 // Default 5 minutes in seconds
        const lockDuration =
          typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault
        const lockDurationInMilliseconds = lockDuration * 1000

        const lockedDocument = await req.payload.find({
          collection: lockedDocumentsCollectionSlug,
          depth: 1,
          limit: 1,
          overrideAccess: false,
          pagination: false,
          req,
          where: {
            and: [
              {
                globalSlug: {
                  equals: slug,
                },
              },
              {
                updatedAt: {
                  greater_than: new Date(new Date().getTime() - lockDurationInMilliseconds),
                },
              },
            ],
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
        select,
      })
    }

    // /////////////////////////////////////
    // Execute before global hook
    // /////////////////////////////////////

    if (globalConfig.hooks?.beforeRead?.length) {
      for (const hook of globalConfig.hooks.beforeRead) {
        doc =
          (await hook({
            context: req.context,
            doc,
            global: globalConfig,
            req,
          })) || doc
      }
    }

    // /////////////////////////////////////
    // Execute globalType field if not selected
    // /////////////////////////////////////
    if (select && doc.globalType) {
      const selectMode = getSelectMode(select)
      if (
        (selectMode === 'include' && !select['globalType']) ||
        (selectMode === 'exclude' && select['globalType'] === false)
      ) {
        delete doc['globalType']
      }
    }

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
      populate,
      req,
      select,
      showHiddenFields,
    })

    // /////////////////////////////////////
    // Execute after global hook
    // /////////////////////////////////////

    if (globalConfig.hooks?.afterRead?.length) {
      for (const hook of globalConfig.hooks.afterRead) {
        doc =
          (await hook({
            context: req.context,
            doc,
            global: globalConfig,
            req,
          })) || doc
      }
    }

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return doc
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
