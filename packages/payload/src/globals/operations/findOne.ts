import type { AccessResult } from '../../config/types.js'
import type {
  JsonObject,
  PayloadRequest,
  PopulateType,
  SelectType,
  Where,
} from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { NotFound } from '../../errors/NotFound.js'
import { afterRead, type AfterReadArgs } from '../../fields/hooks/afterRead/index.js'
import { lockedDocumentsCollectionSlug } from '../../locked-documents/config.js'
import { getSelectMode } from '../../utilities/getSelectMode.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { replaceWithDraftIfAvailable } from '../../versions/drafts/replaceWithDraftIfAvailable.js'

export type GlobalFindOneArgs = {
  /**
   * You may pass the document data directly which will skip the `db.findOne` database query.
   * This is useful if you want to use this endpoint solely for running hooks and populating data.
   */
  data?: Record<string, unknown>
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  includeLockStatus?: boolean
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  slug: string
} & Pick<AfterReadArgs<JsonObject>, 'flattenLocales'>

export const findOneOperation = async <T extends Record<string, unknown>>(
  args: GlobalFindOneArgs,
): Promise<T> => {
  const {
    slug,
    depth,
    disableErrors,
    draft: replaceWithVersion = false,
    flattenLocales,
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
    // beforeOperation - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.beforeOperation?.length) {
      for (const hook of globalConfig.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            context: args.req.context,
            global: globalConfig,
            operation: 'read',
            req: args.req,
          })) || args
      }
    }

    // /////////////////////////////////////
    // Retrieve and execute access
    // /////////////////////////////////////

    let accessResult!: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ disableErrors, req }, globalConfig.access.read)
    }

    if (accessResult === false) {
      if (!disableErrors) {
        throw new NotFound(req.t)
      }
      return null!
    }

    const select = sanitizeSelect({
      fields: globalConfig.flattenedFields,
      forceSelect: globalConfig.forceSelect,
      select: incomingSelect,
    })

    // /////////////////////////////////////
    // Perform database operation
    // /////////////////////////////////////

    const docFromDB = await req.payload.db.findGlobal({
      slug,
      locale: locale!,
      req,
      select,
      where: overrideAccess ? undefined : (accessResult as Where),
    })

    // Check if no document was returned (Postgres returns {} instead of null)
    const hasDoc = docFromDB && Object.keys(docFromDB).length > 0

    if (!hasDoc && !args.data && !overrideAccess && accessResult !== true) {
      if (!disableErrors) {
        return {} as any
      }
      return null!
    }

    let doc = (args.data as any) ?? (hasDoc ? docFromDB : null) ?? {}

    // /////////////////////////////////////
    // Include Lock Status if required
    // /////////////////////////////////////
    if (includeLockStatus && slug) {
      let lockStatus: JsonObject | null = null

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
          lockStatus = lockedDocument.docs[0]!
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

    if (replaceWithVersion && hasDraftsEnabled(globalConfig)) {
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
      depth: depth!,
      doc,
      draft: replaceWithVersion,
      fallbackLocale: fallbackLocale!,
      flattenLocales,
      global: globalConfig,
      locale: locale!,
      overrideAccess,
      populate,
      req,
      select,
      showHiddenFields: showHiddenFields!,
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
