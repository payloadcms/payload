import type { I18n } from '@payloadcms/translations'
import type { DeepPartial } from 'ts-essentials'

import { z } from 'zod'

import type { SanitizedGlobalPermission } from '../../auth/types.js'
import type { FindOptions } from '../../collections/operations/find.js'
import type {
  GlobalSlug,
  JsonObject,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type {
  Operation,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformGlobalWithSelect,
  Where,
} from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type {
  DataFromGlobalSlug,
  DraftFlagFromGlobalSlug,
  SanitizedGlobalConfig,
  SelectFromGlobalSlug,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { APIError } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple } from '../../index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import {
  getGlobalOperationInputSchema,
  validateGlobalOperationData,
} from '../../operations/entitySchema.js'
import { prepareGlobalOperationData } from '../../operations/prepareData.js'
import { dataSchema, globalInput } from '../../operations/schemaFields.js'
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { getSelectMode } from '../../utilities/getSelectMode.js'
import {
  hasDraftsEnabled,
  hasDraftValidationEnabled,
  hasLocalizeStatusEnabled,
} from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildLocalizedPublishData } from '../../versions/buildSingleLocalePublishData.js'
import { getLatestGlobalVersion } from '../../versions/getLatestGlobalVersion.js'
import { saveVersion } from '../../versions/saveVersion.js'

type Args<TSlug extends GlobalSlug> = {
  autosave?: boolean
  data: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  depth?: number
  disableTransaction?: boolean
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  overrideAccess?: boolean
  overrideLock?: boolean
  populate?: PopulateType
  publishAllLocales?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
  slug: string
  unpublishAllLocales?: boolean
} & Pick<FindOptions<string, TSelect>, 'select'>

const updateGlobalDocument = async <
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>(
  args: Args<TSlug>,
): Promise<TransformGlobalWithSelect<TSlug, TSelect>> => {
  const {
    slug,
    autosave,
    depth,
    disableTransaction,
    draft: draftArg,
    globalConfig,
    overrideAccess,
    overrideLock,
    populate,
    publishAllLocales: publishAllLocalesArg,
    req: { fallbackLocale, locale, payload, payload: { config } = {} },
    req,
    select: incomingSelect,
    showHiddenFields,
    unpublishAllLocales: unpublishAllLocalesArg,
  } = args

  try {
    const shouldCommit = !disableTransaction && (await initTransaction(req))

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
            operation: 'update',
            overrideAccess,
            req: args.req,
          })) || args
      }
    }

    let { data } = args

    const publishAllLocales =
      !draftArg &&
      (publishAllLocalesArg ??
        (hasLocalizeStatusEnabled(globalConfig) && locale !== 'all' ? false : true))
    const unpublishAllLocales =
      typeof unpublishAllLocalesArg === 'string'
        ? unpublishAllLocalesArg === 'true'
        : !!unpublishAllLocalesArg
    const isSavingDraft =
      Boolean(draftArg && hasDraftsEnabled(globalConfig)) &&
      data._status !== 'published' &&
      !publishAllLocales

    if (isSavingDraft) {
      data._status = 'draft'
    }

    // /////////////////////////////////////
    // 1. Retrieve and execute access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess(
          {
            data,
            req,
          },
          globalConfig.access.update,
        )
      : true

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////

    const query: Where = overrideAccess ? undefined! : (accessResults as Where)

    // /////////////////////////////////////
    // 2. Retrieve document
    // /////////////////////////////////////
    const globalVersionResult = await getLatestGlobalVersion({
      slug,
      config: globalConfig,
      locale: publishAllLocales || unpublishAllLocales ? 'all' : locale!,
      payload,
      req,
      where: query,
    })
    const { global, globalExists } = globalVersionResult || {}

    let globalJSON: JsonObject = {}

    if (globalVersionResult && globalVersionResult.global) {
      globalJSON = deepCopyObjectSimple(global)

      if (globalJSON._id) {
        delete globalJSON._id
      }
    }

    const originalDoc = await afterRead({
      collection: null,
      context: req.context,
      depth: 0,
      doc: deepCopyObjectSimple(globalJSON),
      draft: draftArg!,
      fallbackLocale: fallbackLocale!,
      global: globalConfig,
      locale: locale!,
      overrideAccess: true,
      req,
      showHiddenFields: showHiddenFields!,
    })

    // ///////////////////////////////////////////
    // Handle potentially locked global documents
    // ///////////////////////////////////////////

    await checkDocumentLockStatus({
      globalSlug: slug,
      lockErrorMessage: `Global with slug "${slug}" is currently locked by another user and cannot be updated.`,
      overrideLock,
      req,
    })

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    data = await beforeValidate({
      collection: null,
      context: req.context,
      data,
      doc: originalDoc,
      global: globalConfig,
      operation: 'update',
      overrideAccess: overrideAccess!,
      req,
    })

    // /////////////////////////////////////
    // beforeValidate - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.beforeValidate?.length) {
      for (const hook of globalConfig.hooks.beforeValidate) {
        data =
          (await hook({
            context: req.context,
            data,
            global: globalConfig,
            originalDoc,
            overrideAccess,
            req,
          })) || data
      }
    }

    // /////////////////////////////////////
    // beforeChange - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.beforeChange?.length) {
      for (const hook of globalConfig.hooks.beforeChange) {
        data =
          (await hook({
            context: req.context,
            data,
            global: globalConfig,
            originalDoc,
            overrideAccess,
            req,
          })) || data
      }
    }

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    const beforeChangeArgs = {
      collection: null,
      context: req.context,
      data,
      doc: originalDoc,
      docWithLocales: globalJSON,
      global: globalConfig,
      operation: 'update' as Operation,
      req,
      skipValidation:
        (isSavingDraft && !hasDraftValidationEnabled(globalConfig)) ||
        // Skip validation for unpublish operations — they only change _status, not document data
        unpublishAllLocales,
    }

    let result: JsonObject = await beforeChange(beforeChangeArgs)

    if (
      config?.localization &&
      hasLocalizeStatusEnabled(globalConfig) &&
      typeof result._status === 'string'
    ) {
      const statusStr = result._status
      result._status = {}
      for (const localeCode of config.localization.localeCodes) {
        ;(result._status as Record<string, unknown>)[localeCode] = statusStr
      }
    }

    // /////////////////////////////////////
    // Handle Localized Data Merging
    // /////////////////////////////////////

    let localizedPublishData: JsonObject | null = null

    if (config && config.localization && globalConfig.versions) {
      if (hasLocalizeStatusEnabled(globalConfig)) {
        if (publishAllLocales || unpublishAllLocales) {
          let accessibleLocaleCodes = config.localization.localeCodes

          if (config.localization.filterAvailableLocales) {
            const filteredLocales = await config.localization.filterAvailableLocales({
              locales: config.localization.locales,
              req,
            })
            accessibleLocaleCodes = filteredLocales.map((locale) =>
              typeof locale === 'string' ? locale : locale.code,
            )
          }

          if (typeof result._status !== 'object' || result._status === null) {
            result._status = {}
          }

          for (const localeCode of accessibleLocaleCodes) {
            result._status[localeCode] = unpublishAllLocales ? 'draft' : 'published'
          }
        } else if (
          !isSavingDraft &&
          result._status &&
          typeof result._status === 'object' &&
          !Array.isArray(result._status) &&
          (result._status as Record<string, unknown>)[locale!] === 'published'
        ) {
          const currentGlobal = await payload.db.findGlobal({
            slug: globalConfig.slug,
            locale: 'all',
            req,
            where: query,
          })

          localizedPublishData = buildLocalizedPublishData({
            config,
            currentDoc: currentGlobal as JsonObject,
            fields: globalConfig.fields,
            locale: locale!,
            result,
          })
        }
      }
    }

    const dataToUpdate: JsonObject = { ...(localizedPublishData ?? result) }

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    const select = sanitizeSelect({
      fields: globalConfig.flattenedFields,
      select: resolveSelect({
        config: globalConfig.select,
        operation: 'update',
        req,
        select: incomingSelect,
      }),
    })

    let resultWithLocales: JsonObject = result

    if (!isSavingDraft) {
      const now = new Date().toISOString()
      // Ensure global has createdAt
      if (!dataToUpdate.createdAt) {
        dataToUpdate.createdAt = now
      }

      // Ensure updatedAt date is always updated
      dataToUpdate.updatedAt = now

      if (globalExists) {
        resultWithLocales = await payload.db.updateGlobal({
          slug,
          data: dataToUpdate,
          req,
          select,
        })
      } else {
        resultWithLocales = await payload.db.createGlobal({
          slug,
          data: dataToUpdate,
          req,
        })
      }

      resultWithLocales.updatedAt = now

      if (localizedPublishData) {
        // Keep full locale payload for version writes during single-locale publish.
        resultWithLocales = {
          ...result,
          createdAt: resultWithLocales.createdAt ?? result.createdAt ?? now,
          updatedAt: now,
        }
      }
    }

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////
    if (globalConfig.versions) {
      const { globalType } = resultWithLocales
      resultWithLocales = await saveVersion({
        autosave,
        docWithLocales: resultWithLocales,
        draft: isSavingDraft,
        global: globalConfig,
        operation: 'update',
        payload,
        req,
        select,
        unpublish: unpublishAllLocales,
      })

      resultWithLocales = {
        ...resultWithLocales,
        globalType,
      }
    }

    // /////////////////////////////////////
    // Execute globalType field if not selected
    // /////////////////////////////////////
    if (select && resultWithLocales.globalType) {
      const selectMode = getSelectMode(select)
      if (
        (selectMode === 'include' && !select['globalType']) ||
        (selectMode === 'exclude' && select['globalType'] === false)
      ) {
        delete resultWithLocales['globalType']
      }
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: null,
      context: req.context,
      depth: depth!,
      doc: resultWithLocales,
      draft: draftArg!,
      fallbackLocale: null,
      global: globalConfig,
      locale: locale!,
      overrideAccess: overrideAccess!,
      populate,
      req,
      select,
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
      data,
      doc: result,
      global: globalConfig,
      operation: 'update',
      previousDoc: originalDoc,
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
            data,
            doc: result,
            global: globalConfig,
            overrideAccess,
            previousDoc: originalDoc,
            req,
          })) || result
      }
    }

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result as TransformGlobalWithSelect<TSlug, TSelect>
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type UpdateGlobalLocalMethod = <
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>(
  options: LocalAPIOptions<UpdateGlobalOptions<TSlug, TSelect>>,
) => Promise<TransformGlobalWithSelect<TSlug, TSelect>>

const updateGlobalSchema = z
  .looseObject({
    ...globalInput,
    autosave: z.boolean().optional(),
    data: dataSchema.describe('Global data'),
    draft: z.boolean().describe('Save the global as a draft').optional().default(false),
  })
  .overwrite((input) => {
    const payload = (input.req as PayloadRequest | undefined)?.payload

    if (!payload) {
      return input
    }

    const data = prepareGlobalOperationData({
      config: payload.config,
      data: input.data,
      global: input.slug,
    })

    validateGlobalOperationData({
      data,
      global: input.slug,
      i18n: (input.req as { i18n?: I18n } | undefined)?.i18n,
      payload,
    })

    return { ...input, data }
  })

export const updateGlobalLocalAPI = defineLocalAPI<UpdateGlobalLocalMethod>()({
  name: 'updateGlobal',
})

export const update = defineOperation({
  action: 'update',
  expose: {
    local: updateGlobalLocalAPI,
    mcp: { name: 'updateGlobal' },
    rest: [
      {
        method: 'post',
        path: '/',
      },
    ],
  },
  getDataSchema: ({ context: payload, input, permissions }) =>
    getGlobalOperationInputSchema({
      global: input.slug,
      i18n: (input.req as { i18n?: I18n } | undefined)?.i18n,
      payload,
      permissions: permissions as SanitizedGlobalPermission | undefined,
    }),
  handler: updateGlobalHandler,
  input: updateGlobalSchema,
  target: 'global',
})

type UpdateGlobalOptionsBase<TSlug extends GlobalSlug, TSelect extends SelectType> = {
  /**
   * Whether the current update should be marked as from autosave.
   * `versions.drafts.autosave` should be specified.
   */
  autosave?: boolean
  /**
   * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
   * which can be read by hooks. Useful if you want to pass additional information to the hooks which
   * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
   * to determine if it should run or not.
   */
  context?: RequestContext
  /**
   * The global data to update.
   */
  data: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
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
   * If you are uploading a file and would like to replace
   * the existing file instead of generating a new filename,
   * you can set the following property to `true`
   */
  overrideLock?: boolean
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType
  /**
   * Publish the document / documents in all locales. Only applies when localization is enabled
   * and the global has localized fields.
   *
   * @default undefined
   */
  publishAllLocales?: boolean
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
   * Unpublish the document / documents in all locales. Only applies when localization is enabled
   * and the global has localized fields.
   */
  unpublishAllLocales?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<string, SelectType>, 'select'>

export type UpdateGlobalOptions<
  TSlug extends GlobalSlug,
  TSelect extends SelectType,
> = DraftFlagFromGlobalSlug<TSlug> & UpdateGlobalOptionsBase<TSlug, TSelect>

async function updateGlobalHandler<
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>(
  payload: Payload,
  options: UpdateGlobalOptions<TSlug, TSelect>,
): Promise<TransformGlobalWithSelect<TSlug, TSelect>> {
  const {
    slug: globalSlug,
    autosave,
    data,
    depth,
    draft,
    overrideAccess = true,
    overrideLock,
    populate,
    publishAllLocales,
    select,
    showHiddenFields,
    unpublishAllLocales,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return updateGlobalDocument<TSlug, TSelect>({
    slug: globalSlug as string,
    autosave,
    data: deepCopyObjectSimple(data), // Ensure mutation of data in create operation hooks doesn't affect the original data
    depth,
    draft,
    globalConfig,
    overrideAccess,
    overrideLock,
    populate,
    publishAllLocales,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    select,
    showHiddenFields,
    unpublishAllLocales,
  })
}
