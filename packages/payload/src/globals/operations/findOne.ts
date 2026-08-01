import { z } from 'zod'

import type { FindOptions } from '../../collections/operations/find.js'
import type { AccessResult } from '../../config/types.js'
import type {
  GlobalSlug,
  Payload,
  RequestContext,
  TransformGlobalWithSelect,
  TypedFallbackLocale,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type {
  JsonObject,
  PayloadRequest,
  PopulateType,
  SelectType,
  Where,
} from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type {
  DraftFlagFromGlobalSlug,
  SanitizedGlobalConfig,
  SelectFromGlobalSlug,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { APIError } from '../../errors/index.js'
import { NotFound } from '../../errors/NotFound.js'
import { afterRead, type AfterReadArgs } from '../../fields/hooks/afterRead/index.js'
import { lockedDocumentsCollectionSlug } from '../../locked-documents/config.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { globalInput } from '../../operations/schemaFields.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { getSelectMode } from '../../utilities/getSelectMode.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { replaceWithDraftIfAvailable } from '../../versions/drafts/replaceWithDraftIfAvailable.js'

type FindGlobalDocumentArgs = {
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
  showHiddenFields?: boolean
  slug: string
} & Pick<AfterReadArgs<JsonObject>, 'flattenLocales'> &
  Pick<FindOptions<string, TSelect>, 'select'>

const findGlobalDocument = async <T extends Record<string, unknown>>(
  args: FindGlobalDocumentArgs,
): Promise<T> => {
  const {
    slug,
    depth,
    disableErrors,
    draft: replaceWithVersion = false,
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
            overrideAccess,
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

    let dbSelect = select

    if (
      globalConfig.versions?.drafts &&
      replaceWithVersion &&
      select &&
      getSelectMode(select) === 'include'
    ) {
      dbSelect = { ...select, createdAt: true, updatedAt: true }
    }
    const docFromDB = await req.payload.db.findGlobal({
      slug,
      locale: locale!,
      req,
      select: dbSelect,
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
            overrideAccess,
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

type FindGlobalLocalMethod = <
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>(
  options: LocalAPIOptions<FindGlobalOptions<TSlug, TSelect>>,
) => Promise<TransformGlobalWithSelect<TSlug, TSelect>>

const findGlobalSchema = z.looseObject(globalInput)

export const findGlobalLocalAPI = defineLocalAPI<FindGlobalLocalMethod>()({ name: 'findGlobal' })

export const find = defineOperation({
  action: 'find',
  expose: {
    local: findGlobalLocalAPI,
    mcp: { name: 'findGlobal' },
    rest: [
      {
        method: 'get',
        path: '/',
      },
    ],
  },
  handler: async <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(
    payload: Payload,
    options: FindGlobalOptions<TSlug, TSelect>,
  ): Promise<TransformGlobalWithSelect<TSlug, TSelect>> => {
    const {
      slug: globalSlug,
      data,
      depth,
      disableErrors,
      draft = false,
      flattenLocales,
      includeLockStatus,
      overrideAccess = true,
      populate,
      select,
      showHiddenFields,
    } = options

    const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

    if (!globalConfig) {
      throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
    }

    return findGlobalDocument({
      slug: globalSlug as string,
      data,
      depth,
      disableErrors,
      draft,
      flattenLocales,
      globalConfig,
      includeLockStatus,
      overrideAccess,
      populate,
      req: await createLocalReq(options as CreateLocalReqOptions, payload),
      select,
      showHiddenFields,
    })
  },
  input: findGlobalSchema,
  target: 'global',
})

type FindGlobalOptionsBase<TSlug extends GlobalSlug, TSelect extends SelectType> = {
  /**
   * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
   * which can be read by hooks. Useful if you want to pass additional information to the hooks which
   * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
   * to determine if it should run or not.
   */
  context?: RequestContext
  /**
   * You may pass the document data directly which will skip the `db.findOne` database query.
   * This is useful if you want to use this endpoint solely for running hooks and populating data.
   */
  data?: Record<string, unknown>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * When set to `true`, errors will not be thrown.
   */
  disableErrors?: boolean
  /**
   * Whether the document should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
   */
  draft?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: TypedFallbackLocale
  /**
   * Include info about the lock status to the result with fields: `_isLocked` and `_userEditing`
   */
  includeLockStatus?: boolean
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: 'all' | TypedLocale
  /**
   * Skip access control.
   * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
   * @default true
   */
  overrideAccess?: boolean
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType
  /**
   * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
   * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
   */
  req?: Partial<PayloadRequest>
  /**
   * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
   * @default false
   */
  showHiddenFields?: boolean
  /**
   * the Global slug to operate against.
   */
  slug: TSlug
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindGlobalDocumentArgs, 'flattenLocales'> &
  Pick<FindOptions<string, SelectType>, 'select'>

export type FindGlobalOptions<
  TSlug extends GlobalSlug,
  TSelect extends SelectType,
> = DraftFlagFromGlobalSlug<TSlug> & FindGlobalOptionsBase<TSlug, TSelect>
