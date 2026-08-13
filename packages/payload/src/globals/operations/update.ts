import type { DeepPartial } from 'ts-essentials'

import type { FindOptions } from '../../collections/operations/local/find.js'
import type { GlobalSlug, JsonObject, LocaleValue, TypedLocale } from '../../index.js'
import type {
  Operation,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformGlobal,
  Where,
} from '../../types/index.js'
import type {
  DataFromGlobalSlug,
  SanitizedGlobalConfig,
  SelectFromGlobalSlug,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple } from '../../index.js'
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
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
import { unwrapLocalizedDoc } from '../../utilities/unwrapLocalizedDoc.js'
import { buildLocalizedPublishData } from '../../versions/buildSingleLocalePublishData.js'
import { getLatestGlobalVersion } from '../../versions/getLatestGlobalVersion.js'
import { saveVersion } from '../../versions/saveVersion.js'

type Args<TSlug extends GlobalSlug, TLocale extends LocaleValue = TypedLocale> = {
  autosave?: boolean
  data: DeepPartial<Omit<DataFromGlobalSlug<TSlug, TLocale>, 'id'>>
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
} & Pick<FindOptions<string, SelectType>, 'select'>

export const updateOperation = async <
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
  TLocale extends LocaleValue = TypedLocale,
>(
  args: Args<TSlug>,
): Promise<TransformGlobal<TSlug, TSelect, TLocale>> => {
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
            slug: globalConfig.slug,
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

    let localeAllDataByLocale: null | Record<string, any> = null

    if (payload.config.localization && locale === 'all') {
      localeAllDataByLocale = {}
      for (const locale of payload.config.localization.localeCodes) {
        localeAllDataByLocale[locale] = unwrapLocalizedDoc({
          config: payload.config,
          doc: data,
          fields: globalConfig.flattenedFields,
          locale,
        })
      }
    }

    if (localeAllDataByLocale) {
      for (const locale of Object.keys(localeAllDataByLocale)) {
        localeAllDataByLocale[locale] = await beforeValidate({
          collection: null,
          context: req.context,
          data: localeAllDataByLocale[locale],
          doc: unwrapLocalizedDoc({
            config: payload.config,
            doc: originalDoc,
            fields: globalConfig.flattenedFields,
            locale,
          }),
          global: globalConfig,
          operation: 'update',
          overrideAccess: overrideAccess!,
          req,
        })
      }
    } else {
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
    }

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

    let result: JsonObject

    if (localeAllDataByLocale) {
      // With `locale: 'all'`, run the field hooks once per locale against that locale's view of
      // the original document, threading the accumulated result through each pass.
      let localeAllResult: JsonObject | null = null

      for (const locale of Object.keys(localeAllDataByLocale)) {
        req.locale = locale

        localeAllResult = await beforeChange({
          ...beforeChangeArgs,
          data: localeAllDataByLocale[locale],
          doc: unwrapLocalizedDoc({
            config: payload.config,
            doc: originalDoc,
            fields: globalConfig.flattenedFields,
            locale,
          }),
          docWithLocales: localeAllResult ?? globalJSON,
        })
      }

      req.locale = 'all'
      result = localeAllResult!
    } else {
      result = await beforeChange(beforeChangeArgs)
    }

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

    return result as TransformGlobal<TSlug, TSelect, TLocale>
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
