import crypto from 'crypto'

import type { CollectionSlug, FindOptions, JsonObject } from '../../index.js'
import type {
  Document,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type {
  Collection,
  DataFromCollectionSlug,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import { ensureUsernameOrEmail } from '../../auth/ensureUsernameOrEmail.js'
import { executeAccess } from '../../auth/executeAccess.js'
import { sendVerificationEmail } from '../../auth/sendVerificationEmail.js'
import { registerLocalStrategy } from '../../auth/strategies/local/register.js'
import { getDuplicateDocumentData } from '../../duplicateDocument/index.js'
import { fillEmptyLocalizedSlugs } from '../../fields/baseFields/slug/fillEmptyLocalizedSlugs.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { saveVersion } from '../../index.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { uploadFiles } from '../../uploads/uploadFiles.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import {
  hasDraftsEnabled,
  hasDraftValidationEnabled,
  hasLocalizeStatusEnabled,
} from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'
import { getOperationSelect } from './utilities/getOperationSelect.js'
import { runCollectionHooks } from './utilities/runCollectionHooks.js'

export type Arguments<TSlug extends CollectionSlug> = {
  autosave?: boolean
  collection: Collection
  data: RequiredDataFromCollectionSlug<TSlug>
  depth?: number
  disableTransaction?: boolean
  disableVerificationEmail?: boolean
  draft?: boolean
  duplicateFromID?: DataFromCollectionSlug<TSlug>['id']
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  populate?: PopulateType
  publishAllLocales?: boolean
  req: PayloadRequest
  selectedLocales?: string[]
  showHiddenFields?: boolean
} & Pick<FindOptions<TSlug, SelectType>, 'select'>

export const createOperation = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: Arguments<TSlug>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
  let args = incomingArgs

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(args.req))

    ensureUsernameOrEmail<TSlug>({
      authOptions: args.collection.config.auth,
      collectionSlug: args.collection.config.slug,
      data: args.data,
      operation: 'create',
      req: args.req,
    })

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'create',
      overrideAccess: args.overrideAccess!,
    })

    const {
      autosave = false,
      collection: { config: collectionConfig },
      collection,
      depth,
      disableVerificationEmail,
      draft = false,
      duplicateFromID,
      overrideAccess,
      overwriteExistingFiles = false,
      populate,
      publishAllLocales: publishAllLocalesArg,
      req: {
        fallbackLocale,
        locale,
        payload,
        payload: { config },
      },
      req,
      select: incomingSelect,
      selectedLocales,
      showHiddenFields,
    } = args

    let { data } = args

    // For creates there is no existing doc — always publish all locales when not a draft.
    const publishAllLocales =
      !draft &&
      (publishAllLocalesArg ?? (hasLocalizeStatusEnabled(collectionConfig) ? false : true))
    const isSavingDraft = Boolean(draft && hasDraftsEnabled(collectionConfig) && !publishAllLocales)

    if (isSavingDraft) {
      data._status = 'draft'
    }

    let duplicatedFromDocWithLocales: JsonObject = {}
    let duplicatedFromDoc: JsonObject = {}

    if (duplicateFromID) {
      const duplicateResult = await getDuplicateDocumentData({
        id: duplicateFromID,
        collectionConfig,
        draftArg: isSavingDraft,
        overrideAccess,
        req,
        selectedLocales,
      })

      duplicatedFromDoc = duplicateResult.duplicatedFromDoc
      duplicatedFromDocWithLocales = duplicateResult.duplicatedFromDocWithLocales
    }

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      await executeAccess(
        { slug: collectionConfig.slug, data, req },
        collectionConfig.access.create,
      )
    }

    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////

    const { data: newFileData, files: filesToUpload } = await generateFileData({
      collection,
      config,
      data,
      draft: isSavingDraft,
      isDuplicating: Boolean(duplicateFromID),
      operation: 'create',
      originalDoc: duplicatedFromDoc,
      overwriteExistingFiles,
      req,
      throwOnMissingFile:
        !isSavingDraft && collection.config.upload.filesRequiredOnCreate !== false,
    })

    data = newFileData

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    data = await beforeValidate({
      collection: collectionConfig,
      context: req.context,
      data,
      doc: duplicatedFromDoc,
      global: null,
      operation: 'create',
      overrideAccess: overrideAccess!,
      req,
    })

    // /////////////////////////////////////
    // beforeValidate - Collections
    // /////////////////////////////////////

    data = await runCollectionHooks({
      hooks: collectionConfig.hooks.beforeValidate,
      invoke: (hook, current) =>
        hook({
          collection: collectionConfig,
          context: req.context,
          data: current,
          operation: 'create',
          originalDoc: duplicatedFromDoc,
          req,
        }),
      payload: data,
    })

    // /////////////////////////////////////
    // beforeChange - Collection
    // /////////////////////////////////////

    data = await runCollectionHooks({
      hooks: collectionConfig.hooks?.beforeChange,
      invoke: (hook, current) =>
        hook({
          collection: collectionConfig,
          context: req.context,
          data: current,
          operation: 'create',
          originalDoc: duplicatedFromDoc,
          req,
        }),
      payload: data,
    })

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    const dataWithLocales = await beforeChange<JsonObject>({
      collection: collectionConfig,
      context: req.context,
      data,
      doc: duplicatedFromDoc,
      docWithLocales: duplicatedFromDocWithLocales,
      global: null,
      operation: 'create',
      overrideAccess,
      req,
      skipValidation: isSavingDraft && !hasDraftValidationEnabled(collectionConfig),
    })

    // When locale='all' or when beforeChange doesn't convert the string (e.g. no locale hook ran),
    // the localized _status remains a plain string. Expand it to a per-locale object so MongoDB
    // doesn't reject the write. This covers both draft and non-draft operations.
    if (
      config.localization &&
      hasLocalizeStatusEnabled(collectionConfig) &&
      typeof dataWithLocales._status === 'string'
    ) {
      const statusStr = dataWithLocales._status
      dataWithLocales._status = {}
      for (const localeCode of config.localization.localeCodes) {
        ;(dataWithLocales._status as Record<string, unknown>)[localeCode] = statusStr
      }
    }

    if (config.localization && hasLocalizeStatusEnabled(collectionConfig) && publishAllLocales) {
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

      if (typeof dataWithLocales._status !== 'object' || dataWithLocales._status === null) {
        dataWithLocales._status = {}
      }

      for (const localeCode of accessibleLocaleCodes) {
        dataWithLocales._status[localeCode] = 'published'
      }
    }

    // Fill every locale of a localized slug so switching locales never lands on an empty slug. The
    // slug field hook only sees the active locale, so the rest are seeded here on create.
    if (config.localization) {
      await fillEmptyLocalizedSlugs({ collection: collectionConfig, data: dataWithLocales, req })
    }

    // /////////////////////////////////////
    // Write files to local storage
    // /////////////////////////////////////

    if (!collectionConfig.upload.disableLocalStorage) {
      await uploadFiles(payload, filesToUpload, req)
    }

    // /////////////////////////////////////
    // Create
    // /////////////////////////////////////

    let doc

    const select = getOperationSelect({
      collectionConfig,
      incomingSelect,
      operation: 'create',
      req,
    })

    if (collectionConfig.auth && !collectionConfig.auth.disableLocalStrategy) {
      if (collectionConfig.auth.verify) {
        dataWithLocales._verified = Boolean(dataWithLocales._verified) || false
        dataWithLocales._verificationToken = crypto.randomBytes(20).toString('hex')
      }

      doc = await registerLocalStrategy({
        collection: collectionConfig,
        doc: dataWithLocales,
        password: data.password as string,
        payload: req.payload,
        req,
      })
    } else {
      doc = await payload.db.create({
        collection: collectionConfig.slug,
        data: dataWithLocales,
        req,
      })
    }

    const verificationToken = doc._verificationToken
    let resultWithLocales: Document = sanitizeInternalFields(doc)

    // /////////////////////////////////////
    // Add collection property for auth collections
    // /////////////////////////////////////

    if (collectionConfig.auth) {
      resultWithLocales = { ...resultWithLocales, collection: collectionConfig.slug }
    }

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////

    if (collectionConfig.versions) {
      await saveVersion({
        id: resultWithLocales.id,
        autosave,
        collection: collectionConfig,
        docWithLocales: resultWithLocales,
        operation: 'create',
        payload,
        req,
        returning: false,
      })
    }

    // /////////////////////////////////////
    // Send verification email if applicable
    // /////////////////////////////////////

    if (collectionConfig.auth && collectionConfig.auth.verify && resultWithLocales.email) {
      await sendVerificationEmail({
        collection: { config: collectionConfig },
        config: payload.config,
        disableEmail: disableVerificationEmail!,
        email: payload.email,
        req,
        token: verificationToken,
        user: resultWithLocales,
      })
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    let result: Document = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: depth!,
      doc: resultWithLocales,
      draft,
      fallbackLocale: fallbackLocale!,
      global: null,
      locale: locale!,
      overrideAccess: overrideAccess!,
      populate,
      req,
      select,
      showHiddenFields: showHiddenFields!,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    result = await runCollectionHooks({
      hooks: collectionConfig.hooks?.afterRead,
      invoke: (hook, doc) =>
        hook({ collection: collectionConfig, context: req.context, doc, overrideAccess, req }),
      payload: result,
    })

    // /////////////////////////////////////
    // afterChange - Fields
    // /////////////////////////////////////

    result = await afterChange({
      collection: collectionConfig,
      context: req.context,
      data,
      doc: result,
      global: null,
      operation: 'create',
      previousDoc: {},
      req,
    })

    // /////////////////////////////////////
    // afterChange - Collection
    // /////////////////////////////////////

    result = await runCollectionHooks({
      hooks: collectionConfig.hooks?.afterChange,
      invoke: (hook, doc) =>
        hook({
          collection: collectionConfig,
          context: req.context,
          data,
          doc,
          operation: 'create',
          overrideAccess,
          previousDoc: {},
          req: args.req,
        }),
      payload: result,
    })

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<TSlug>({
      args,
      collection: collectionConfig,
      operation: 'create',
      overrideAccess: args.overrideAccess!,
      result,
    })

    await unlinkTempFiles({ collectionConfig, config, req })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
