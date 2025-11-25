import type { DeepPartial } from 'ts-essentials'

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
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { unwrapLocalizedDoc } from '../../utilities/unwrapLocalizedDoc.js'
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
  publishSpecificLocale?: string
  req: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  slug: string
}

export const updateOperation = async <
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
  TLocale extends LocaleValue = TypedLocale,
>(
  args: Args<TSlug>,
): Promise<TransformGlobal<TSlug, TSelect, TLocale>> => {
  if (args.publishSpecificLocale) {
    args.req.locale = args.publishSpecificLocale
  }

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
    publishSpecificLocale,
    req: { fallbackLocale, locale, payload },
    req,
    select: incomingSelect,
    showHiddenFields,
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
            req: args.req,
          })) || args
      }
    }

    let { data } = args

    const isSavingDraft =
      Boolean(draftArg && globalConfig.versions?.drafts) && data._status !== 'published'

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
      locale: locale!,
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
        isSavingDraft && globalConfig.versions.drafts && !globalConfig.versions.drafts.validate,
    }

    let nullableResult: JsonObject | null = null

    if (localeAllDataByLocale) {
      for (const locale of Object.keys(localeAllDataByLocale)) {
        req.locale = locale
        const doc = unwrapLocalizedDoc({
          config: payload.config,
          doc: originalDoc,
          fields: globalConfig.flattenedFields,
          locale,
        })
        nullableResult = await beforeChange({
          ...beforeChangeArgs,
          data: localeAllDataByLocale[locale],
          doc,
          docWithLocales: nullableResult || globalJSON,
        })
      }

      req.locale = 'all'
    } else {
      nullableResult = await beforeChange(beforeChangeArgs)
    }

    let result = nullableResult!

    let snapshotToSave: JsonObject | undefined

    if (payload.config.localization && globalConfig.versions) {
      if (publishSpecificLocale) {
        snapshotToSave = deepCopyObjectSimple(result)

        // the published data to save to the main document
        result = await beforeChange({
          ...beforeChangeArgs,
          docWithLocales:
            (
              await getLatestGlobalVersion({
                slug,
                config: globalConfig,
                payload,
                published: true,
                req,
                where: query,
              })
            )?.global || {},
        })
      }
    }

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    const select = sanitizeSelect({
      fields: globalConfig.flattenedFields,
      forceSelect: globalConfig.forceSelect,
      select: incomingSelect,
    })

    if (!isSavingDraft) {
      const now = new Date().toISOString()
      // Ensure global has createdAt
      if (!result.createdAt) {
        result.createdAt = now
      }

      // Ensure updatedAt date is always updated
      result.updatedAt = now

      if (globalExists) {
        result = await payload.db.updateGlobal({
          slug,
          data: result,
          req,
          select,
        })
      } else {
        result = await payload.db.createGlobal({
          slug,
          data: result,
          req,
        })
      }
    }

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////
    if (globalConfig.versions) {
      const { globalType } = result
      result = await saveVersion({
        autosave,
        docWithLocales: result,
        draft: isSavingDraft,
        global: globalConfig,
        operation: 'update',
        payload,
        publishSpecificLocale,
        req,
        select,
        snapshot: snapshotToSave,
      })

      result = {
        ...result,
        globalType,
      }
    }

    // /////////////////////////////////////
    // Execute globalType field if not selected
    // /////////////////////////////////////
    if (select && result.globalType) {
      const selectMode = getSelectMode(select)
      if (
        (selectMode === 'include' && !select['globalType']) ||
        (selectMode === 'exclude' && select['globalType'] === false)
      ) {
        delete result['globalType']
      }
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: null,
      context: req.context,
      depth: depth!,
      doc: result,
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
