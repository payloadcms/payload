import type { DeepPartial } from 'ts-essentials'

import type { FindOptions } from '../../collections/operations/local/find.js'
import type { GlobalSlug, JsonObject } from '../../index.js'
import type {
  Operation,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformGlobalWithSelect,
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
import { mergeLocalizedData } from '../../utilities/mergeLocalizedData.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import {
  buildAllLocalesPublicationHookDoc,
  getAllLocalesPublicationStatus,
  hasAuthorizedAllLocalesPublicationStatus,
  normalizeAllLocalesPublicationStatus,
  reconcileAllLocalesPublicationStatus,
  validateAllLocalesPublicationFlags,
} from '../../versions/allLocalesPublicationStatus.js'
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
  publishSpecificLocale?: string
  req: PayloadRequest
  showHiddenFields?: boolean
  slug: string
  unpublishAllLocales?: boolean
} & Pick<FindOptions<string, SelectType>, 'select'>

export const updateOperation = async <
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>(
  args: Args<TSlug>,
): Promise<TransformGlobalWithSelect<TSlug, TSelect>> => {
  if (args.publishSpecificLocale) {
    args.req.locale = args.publishSpecificLocale
  }

  const req = args.req
  const initialGlobalConfig = args.globalConfig

  validateAllLocalesPublicationFlags({
    publishAllLocales: args.publishAllLocales,
    unpublishAllLocales: args.unpublishAllLocales,
  })

  const initialAllLocalesPublicationStatus = getAllLocalesPublicationStatus({
    hasLocalizedStatus: Boolean(
      req.payload.config.localization && hasLocalizeStatusEnabled(initialGlobalConfig),
    ),
    publishAllLocales:
      !args.draft &&
      (args.publishAllLocales ?? (hasLocalizeStatusEnabled(initialGlobalConfig) ? false : true)),
    unpublishAllLocales: Boolean(args.unpublishAllLocales),
  })

  const initialAllLocalesPublicationIntent = normalizeAllLocalesPublicationStatus({
    data: args.data,
    status: initialAllLocalesPublicationStatus,
  })

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(req))

    // /////////////////////////////////////
    // beforeOperation - Global
    // /////////////////////////////////////

    if (initialGlobalConfig.hooks?.beforeOperation?.length) {
      for (const hook of initialGlobalConfig.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            context: args.req.context,
            global: initialGlobalConfig,
            operation: 'update',
            overrideAccess: args.overrideAccess,
            req: args.req,
          })) || args
      }
    }

    const {
      slug,
      autosave,
      depth,
      draft: draftArg,
      globalConfig,
      overrideAccess,
      overrideLock,
      populate,
      publishAllLocales: publishAllLocalesArg,
      publishSpecificLocale,
      req: { fallbackLocale, locale, payload, payload: { config } = {} },
      select: incomingSelect,
      showHiddenFields,
      unpublishAllLocales: unpublishAllLocalesArg,
    } = args

    let { data } = args

    validateAllLocalesPublicationFlags({
      publishAllLocales: publishAllLocalesArg,
      unpublishAllLocales: unpublishAllLocalesArg,
    })

    let publishAllLocales =
      !draftArg && (publishAllLocalesArg ?? (hasLocalizeStatusEnabled(globalConfig) ? false : true))
    let unpublishAllLocales =
      typeof unpublishAllLocalesArg === 'string'
        ? unpublishAllLocalesArg === 'true'
        : !!unpublishAllLocalesArg
    const requestedAllLocalesPublicationStatus = getAllLocalesPublicationStatus({
      hasLocalizedStatus: Boolean(config?.localization && hasLocalizeStatusEnabled(globalConfig)),
      publishAllLocales,
      unpublishAllLocales,
    })
    const allLocalesPublicationStatus = reconcileAllLocalesPublicationStatus({
      data,
      intent: initialAllLocalesPublicationIntent,
      status: requestedAllLocalesPublicationStatus,
    })

    if (requestedAllLocalesPublicationStatus && !allLocalesPublicationStatus) {
      publishAllLocales = false
      unpublishAllLocales = false
    }

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

    let statusFieldAccessDenied = false

    data = await beforeValidate({
      collection: null,
      context: req.context,
      data,
      doc: originalDoc,
      global: globalConfig,
      onFieldAccessDenied: (path) => {
        if (path === '_status') {
          statusFieldAccessDenied = true
        }
      },
      operation: 'update',
      overrideAccess: overrideAccess!,
      req,
    })

    const publicationHookDoc = buildAllLocalesPublicationHookDoc({
      doc: originalDoc,
      docWithLocales: globalJSON,
      status:
        !statusFieldAccessDenied && data._status === allLocalesPublicationStatus
          ? allLocalesPublicationStatus
          : undefined,
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
            originalDoc: publicationHookDoc,
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
            originalDoc: publicationHookDoc,
            overrideAccess,
            req,
          })) || data
      }
    }

    const publicationData = { ...data }

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    const beforeChangeArgs = {
      collection: null,
      context: req.context,
      data,
      doc: publicationHookDoc,
      docWithLocales: globalJSON,
      global: globalConfig,
      operation: 'update' as Operation,
      req,
      skipValidation:
        (isSavingDraft && !hasDraftValidationEnabled(globalConfig)) ||
        // Skip validation for unpublish operations — they only change _status, not document data
        unpublishAllLocales,
    }

    let statusFieldValue: unknown

    let result: JsonObject = await beforeChange({
      ...beforeChangeArgs,
      onDataProcessed: (processedData) => {
        statusFieldValue = processedData._status
      },
    })

    const hasAuthorizedPublicationStatus = hasAuthorizedAllLocalesPublicationStatus({
      data: publicationData,
      fieldAccessDenied: statusFieldAccessDenied,
      fieldValue: statusFieldValue,
      status: allLocalesPublicationStatus,
    })
    if (
      allLocalesPublicationStatus &&
      !hasAuthorizedPublicationStatus &&
      typeof statusFieldValue === 'undefined' &&
      typeof globalJSON._status === 'object' &&
      globalJSON._status !== null
    ) {
      result._status = { ...globalJSON._status }
    }

    let snapshotToSave: JsonObject | undefined

    // /////////////////////////////////////
    // Handle Localized Data Merging
    // /////////////////////////////////////

    if (config && config.localization && globalConfig.versions) {
      let currentGlobal: JsonObject | null = null
      let snapshotData: JsonObject | undefined

      if (hasLocalizeStatusEnabled(globalConfig)) {
        if (hasAuthorizedPublicationStatus) {
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
        } else if (!isSavingDraft) {
          // publishing a single locale
          currentGlobal = await payload.db.findGlobal({
            slug: globalConfig.slug,
            req,
            where: query,
          })
          snapshotData = result
        }
      } else if (publishSpecificLocale) {
        // previous way of publishing a single locale
        currentGlobal = (
          await getLatestGlobalVersion({
            slug,
            config: globalConfig,
            payload,
            published: true,
            req,
            where: query,
          })
        ).global
        snapshotData = {
          ...result,
          _status: 'draft',
        }
      }

      if (snapshotData) {
        snapshotToSave = deepCopyObjectSimple(snapshotData)

        result = mergeLocalizedData({
          configBlockReferences: config.blocks,
          dataWithLocales: result || {},
          docWithLocales: currentGlobal || {},
          fields: globalConfig.fields,
          selectedLocales: [locale!],
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
        unpublish: unpublishAllLocales,
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
