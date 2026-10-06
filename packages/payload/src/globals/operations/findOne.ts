import type { FindOptions } from '../../collections/operations/local/find.js'
import type { AccessResult } from '../../config/types.js'
import type { JsonObject, PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { NotFound } from '../../errors/NotFound.js'
import { afterRead, type AfterReadArgs } from '../../fields/hooks/afterRead/index.js'
import { lockedDocumentsCollectionSlug } from '../../locked-documents/config.js'
import { getSelectMode } from '../../utilities/getSelectMode.js'
import { hasDraftsEnabled, hasLocalizeStatusEnabled } from '../../utilities/getVersionsConfig.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { appendGlobalVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { getQueryDraftsSelect } from '../../versions/drafts/getQueryDraftsSelect.js'
import { getVersionStatusQuery } from '../../versions/getVersionStatusQuery.js'
import { resolveVersionDocument } from '../../versions/resolveVersionDocument.js'

export type GlobalFindOneArgs = {
  /**
   * You may pass the document data directly which will skip the `db.findOne` database query.
   * This is useful if you want to use this endpoint solely for running hooks and populating data.
   */
  data?: Record<string, unknown>
  depth?: number
  disableErrors?: boolean
  globalConfig: SanitizedGlobalConfig
  includeLockStatus?: boolean
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
  slug: string
  version?: 'draft' | 'latest' | 'published'
} & Pick<AfterReadArgs<JsonObject>, 'flattenLocales'> &
  Pick<FindOptions<string, SelectType>, 'select'>

export const findOneOperation = async <T extends Record<string, unknown>>(
  args: GlobalFindOneArgs,
): Promise<T> => {
  const {
    slug,
    depth,
    disableErrors,
    flattenLocales,
    globalConfig,
    includeLockStatus: includeLockStatusFromArgs,
    overrideAccess = false,
    populate,
    req: { fallbackLocale, locale },
    req,
    select: incomingSelect,
    showHiddenFields,
  } = args

  const includeLockStatus =
    includeLockStatusFromArgs && req.payload.collections?.[lockedDocumentsCollectionSlug]

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
          overrideAccess,
          req: args.req,
        })) || args
    }
  }

  const version = args.version ?? 'published'

  // /////////////////////////////////////
  // Retrieve and execute access
  // /////////////////////////////////////

  let accessResult!: AccessResult

  if (!overrideAccess) {
    accessResult = await executeAccess(
      { slug: globalConfig.slug, disableErrors, req },
      globalConfig.access.read,
    )
  }

  if (accessResult === false) {
    if (!disableErrors) {
      throw new NotFound(req.t)
    }
    return null!
  }

  const select = sanitizeSelect({
    fields: globalConfig.flattenedFields,
    select: resolveSelect({
      config: globalConfig.select,
      operation: 'read',
      req,
      select: incomingSelect,
    }),
  })

  // /////////////////////////////////////
  // Perform database operation
  // /////////////////////////////////////

  const hasDrafts = hasDraftsEnabled(globalConfig)
  let dbSelect = select

  if (hasDrafts && hasLocalizeStatusEnabled(globalConfig) && select) {
    dbSelect = { ...select }

    if (getSelectMode(select) === 'include') {
      dbSelect._status = true
    } else {
      delete dbSelect._status

      if (Object.keys(dbSelect).length === 0) {
        dbSelect = undefined
      }
    }
  }

  const publishedQuery = hasDrafts
    ? getVersionStatusQuery({
        entity: globalConfig,
        locale,
        localization: req.payload.config.localization,
        status: 'published',
      })
    : undefined

  const docFromDB = await req.payload.db.findGlobal({
    slug,
    locale: locale!,
    req,
    select: dbSelect,
    where: combineQueries(publishedQuery!, overrideAccess ? true : accessResult),
  })

  // Check if no document was returned (Postgres returns {} instead of null)
  const hasDoc = docFromDB && Object.keys(docFromDB).length > 0

  let doc: JsonObject = args.data ?? (hasDoc ? docFromDB : null) ?? {}

  if (hasDrafts && version !== 'published') {
    const draftQuery = appendGlobalVersionToQueryKey(
      getVersionStatusQuery({
        entity: globalConfig,
        locale,
        localization: req.payload.config.localization,
        status: 'draft',
      }),
    )
    const draft = (
      await req.payload.db.findGlobalVersions({
        global: slug,
        limit: 1,
        locale: locale!,
        pagination: false,
        req,
        select: getQueryDraftsSelect({ select: dbSelect }),
        sort: '-updatedAt',
        where: combineQueries(
          { and: [{ latest: { equals: true } }, draftQuery] },
          hasWhereAccessResult(accessResult) ? appendGlobalVersionToQueryKey(accessResult) : true,
        ),
      })
    ).docs[0]

    if (draft) {
      doc = draft.version
    } else if (version === 'draft') {
      if (disableErrors) {
        return null!
      }
      throw new NotFound(req.t)
    }
  }

  if (!Object.keys(doc).length && !args.data && !overrideAccess && accessResult !== true) {
    if (!disableErrors) {
      return {} as T
    }
    return null!
  }

  if (hasDrafts) {
    doc = resolveVersionDocument({
      doc,
      entity: globalConfig,
      publishedDoc: docFromDB,
      req,
      version,
    })
  }

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
  // Execute before global hook
  // /////////////////////////////////////

  if (globalConfig.hooks?.beforeRead?.length) {
    for (const hook of globalConfig.hooks.beforeRead) {
      doc =
        (await hook({
          context: req.context,
          doc,
          global: globalConfig,
          overrideAccess,
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
    draft: version !== 'published',
    fallbackLocale: fallbackLocale!,
    flattenLocales,
    global: globalConfig,
    locale: locale!,
    overrideAccess,
    populate,
    req,
    select,
    showHiddenFields: showHiddenFields!,
    version,
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
          overrideAccess,
          req,
        })) || doc
    }
  }

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return doc as T
}
