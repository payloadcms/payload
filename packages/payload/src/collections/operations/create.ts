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
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

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
  publishSpecificLocale?: string
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
    })

    if (args.publishSpecificLocale) {
      args.req.locale = args.publishSpecificLocale
    }

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
      publishSpecificLocale,
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
      await executeAccess({ data, req }, collectionConfig.access.create)
    }

    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////

    const { data: newFileData, files: filesToUpload } = await generateFileData({
      collection,
      config,
      data,
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

    if (collectionConfig.hooks.beforeValidate?.length) {
      for (const hook of collectionConfig.hooks.beforeValidate) {
        data =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            data,
            operation: 'create',
            originalDoc: duplicatedFromDoc,
            req,
          })) || data
      }
    }

    // /////////////////////////////////////
    // beforeChange - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeChange?.length) {
      for (const hook of collectionConfig.hooks.beforeChange) {
        data =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            data,
            operation: 'create',
            originalDoc: duplicatedFromDoc,
            req,
          })) || data
      }
    }

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    const resultWithLocales = await beforeChange<JsonObject>({
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

    if (
      config.localization &&
      collectionConfig.versions &&
      collectionConfig.versions.drafts &&
      collectionConfig.versions.drafts.localizeStatus &&
      publishAllLocales
    ) {
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

      if (typeof resultWithLocales._status !== 'object' || resultWithLocales._status === null) {
        resultWithLocales._status = {}
      }

      for (const localeCode of accessibleLocaleCodes) {
        resultWithLocales._status[localeCode] = 'published'
      }
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

    const select = sanitizeSelect({
      fields: collectionConfig.flattenedFields,
      forceSelect: collectionConfig.forceSelect,
      select: incomingSelect,
    })

    if (collectionConfig.auth && !collectionConfig.auth.disableLocalStrategy) {
      if (collectionConfig.auth.verify) {
        resultWithLocales._verified = Boolean(resultWithLocales._verified) || false
        resultWithLocales._verificationToken = crypto.randomBytes(20).toString('hex')
      }

      doc = await registerLocalStrategy({
        collection: collectionConfig,
        doc: resultWithLocales,
        password: data.password as string,
        payload: req.payload,
        req,
      })
    } else {
      doc = await payload.db.create({
        collection: collectionConfig.slug,
        data: resultWithLocales,
        req,
      })
    }

    const verificationToken = doc._verificationToken
    let result: Document = sanitizeInternalFields(doc)

    // /////////////////////////////////////
    // Add collection property for auth collections
    // /////////////////////////////////////

    if (collectionConfig.auth) {
      result = { ...result, collection: collectionConfig.slug }
    }

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////

    if (collectionConfig.versions) {
      await saveVersion({
        id: result.id,
        autosave,
        collection: collectionConfig,
        docWithLocales: result,
        operation: 'create',
        payload,
        publishSpecificLocale,
        req,
        returning: false,
      })
    }

    // /////////////////////////////////////
    // Send verification email if applicable
    // /////////////////////////////////////

    if (collectionConfig.auth && collectionConfig.auth.verify && result.email) {
      await sendVerificationEmail({
        collection: { config: collectionConfig },
        config: payload.config,
        disableEmail: disableVerificationEmail!,
        email: payload.email,
        req,
        token: verificationToken,
        user: result,
      })
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: depth!,
      doc: result,
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

    if (collectionConfig.hooks?.afterRead?.length) {
      for (const hook of collectionConfig.hooks.afterRead) {
        result =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result,
            req,
          })) || result
      }
    }

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

    if (collectionConfig.hooks?.afterChange?.length) {
      for (const hook of collectionConfig.hooks.afterChange) {
        result =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            data,
            doc: result,
            operation: 'create',
            previousDoc: {},
            req: args.req,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<TSlug>({
      args,
      collection: collectionConfig,
      operation: 'create',
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
