import type { DeepPartial } from 'ts-essentials'

import type { Args } from '../../../fields/hooks/beforeChange/index.js'
import type {
  CollectionSlug,
  FileToSave,
  SanitizedConfig,
  TypedFallbackLocale,
} from '../../../index.js'
import type {
  JsonObject,
  Payload,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../../types/index.js'
import type {
  DataFromCollectionSlug,
  SanitizedCollectionConfig,
  SelectFromCollectionSlug,
  TypeWithID,
} from '../../config/types.js'

import { ensureUsernameOrEmail } from '../../../auth/ensureUsernameOrEmail.js'
import { generatePasswordSaltHash } from '../../../auth/strategies/local/generatePasswordSaltHash.js'
import { afterChange } from '../../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple, getLatestCollectionVersion, saveVersion } from '../../../index.js'
import { deleteAssociatedFiles } from '../../../uploads/deleteAssociatedFiles.js'
import { uploadFiles } from '../../../uploads/uploadFiles.js'
import { checkDocumentLockStatus } from '../../../utilities/checkDocumentLockStatus.js'
import {
  hasDraftsEnabled,
  hasDraftValidationEnabled,
  hasLocalizeStatusEnabled,
} from '../../../utilities/getVersionsConfig.js'
import { mergeLocalizedData } from '../../../utilities/mergeLocalizedData.js'
export type SharedUpdateDocumentArgs<TSlug extends CollectionSlug> = {
  autosave: boolean
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  data: DeepPartial<DataFromCollectionSlug<TSlug>>
  depth: number
  docWithLocales: JsonObject & TypeWithID
  draftArg: boolean
  fallbackLocale: TypedFallbackLocale
  filesToUpload: FileToSave[]
  id: number | string
  locale: string
  overrideAccess: boolean
  overrideLock: boolean
  payload: Payload
  populate?: PopulateType
  publishAllLocales?: boolean
  publishSpecificLocale?: string
  req: PayloadRequest
  select: SelectType
  showHiddenFields: boolean
  unpublishAllLocales?: boolean
}

/**
 * This function is used to update a document in the DB and return the result.
 *
 * It runs the following hooks in order:
 * - beforeValidate - Fields
 * - beforeValidate - Collection
 * - beforeChange - Collection
 * - beforeChange - Fields
 * - afterRead - Fields
 * - afterRead - Collection
 * - afterChange - Fields
 * - afterChange - Collection
 */
export const updateDocument = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug> = SelectType,
>({
  id,
  autosave,
  collectionConfig,
  config,
  data,
  depth,
  docWithLocales,
  draftArg,
  fallbackLocale,
  filesToUpload,
  locale,
  overrideAccess,
  overrideLock,
  payload,
  populate,
  publishAllLocales: publishAllLocalesArg,
  publishSpecificLocale,
  req,
  select,
  showHiddenFields,
  unpublishAllLocales: unpublishAllLocalesArg,
}: SharedUpdateDocumentArgs<TSlug>): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
  const password = data?.password
  const publishAllLocales =
    !draftArg &&
    (publishAllLocalesArg ?? (hasLocalizeStatusEnabled(collectionConfig) ? false : true))
  const unpublishAllLocales =
    typeof unpublishAllLocalesArg === 'string'
      ? unpublishAllLocalesArg === 'true'
      : !!unpublishAllLocalesArg
  const isSavingDraft =
    Boolean(draftArg && hasDraftsEnabled(collectionConfig)) &&
    data._status !== 'published' &&
    !publishAllLocales
  const shouldSavePassword = Boolean(
    password &&
      collectionConfig.auth &&
      (!collectionConfig.auth.disableLocalStrategy ||
        (typeof collectionConfig.auth.disableLocalStrategy === 'object' &&
          collectionConfig.auth.disableLocalStrategy.enableFields)) &&
      !isSavingDraft,
  )

  if (isSavingDraft) {
    data._status = 'draft'
  }

  // /////////////////////////////////////
  // Handle potentially locked documents
  // /////////////////////////////////////

  await checkDocumentLockStatus({
    id,
    collectionSlug: collectionConfig.slug,
    lockErrorMessage: `Document with ID ${id} is currently locked by another user and cannot be updated.`,
    overrideLock,
    req,
  })

  const originalDoc = await afterRead({
    collection: collectionConfig,
    context: req.context,
    depth: 0,
    doc: deepCopyObjectSimple(docWithLocales),
    draft: draftArg,
    fallbackLocale: id ? null : fallbackLocale,
    global: null,
    locale,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })

  const isRestoringDraftFromTrash = Boolean(originalDoc?.deletedAt) && data?._status !== 'published'

  if (collectionConfig.auth) {
    ensureUsernameOrEmail<TSlug>({
      authOptions: collectionConfig.auth,
      collectionSlug: collectionConfig.slug,
      data,
      operation: 'update',
      originalDoc,
      req,
    })
  }

  // /////////////////////////////////////
  // Delete any associated files
  // /////////////////////////////////////

  await deleteAssociatedFiles({
    collectionConfig,
    config,
    doc: docWithLocales,
    files: filesToUpload,
    overrideDelete: false,
    req,
  })

  // /////////////////////////////////////
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await beforeValidate<DeepPartial<DataFromCollectionSlug<TSlug>>>({
    id,
    collection: collectionConfig,
    context: req.context,
    data,
    doc: originalDoc,
    global: null,
    operation: 'update',
    overrideAccess,
    req,
  })

  // /////////////////////////////////////
  // beforeValidate - Collection
  // /////////////////////////////////////

  if (collectionConfig.hooks?.beforeValidate?.length) {
    for (const hook of collectionConfig.hooks.beforeValidate) {
      data =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          data,
          operation: 'update',
          originalDoc,
          req,
        })) || data
    }
  }

  // /////////////////////////////////////
  // Write files to local storage
  // /////////////////////////////////////

  if (!collectionConfig.upload.disableLocalStorage) {
    await uploadFiles(payload, filesToUpload, req)
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
          operation: 'update',
          originalDoc,
          req,
        })) || data
    }
  }

  // /////////////////////////////////////
  // beforeChange - Fields
  // /////////////////////////////////////

  const beforeChangeArgs: Args<DataFromCollectionSlug<TSlug>> = {
    id,
    collection: collectionConfig,
    context: req.context,
    data: { ...data, id },
    doc: originalDoc,
    docWithLocales,
    global: null,
    operation: 'update',
    overrideAccess,
    req,
    skipValidation:
      // only skip validation for drafts when draft validation is false
      (isSavingDraft && !hasDraftValidationEnabled(collectionConfig)) ||
      // Skip validation for trash operations since they're just metadata updates
      (collectionConfig.trash && (Boolean(data?.deletedAt) || isRestoringDraftFromTrash)),
  }

  // /////////////////////////////////////
  // Handle Localized Data Merging
  // /////////////////////////////////////

  let result: JsonObject = await beforeChange(beforeChangeArgs)
  let snapshotToSave: JsonObject | undefined

  if (config.localization && collectionConfig.versions) {
    let snapshotData: JsonObject | undefined
    let currentDoc

    if (collectionConfig.versions.drafts && collectionConfig.versions.drafts.localizeStatus) {
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
      } else if (!isSavingDraft) {
        // publishing a single locale
        currentDoc = await payload.db.findOne<DataFromCollectionSlug<TSlug>>({
          collection: collectionConfig.slug,
          req,
          where: { id: { equals: id } },
        })
        snapshotData = result
      }
    } else if (publishSpecificLocale) {
      // previous way of publishing a single locale
      currentDoc = await getLatestCollectionVersion({
        id,
        config: collectionConfig,
        payload,
        published: true,
        query: {
          collection: collectionConfig.slug,
          locale: 'all',
          req,
          where: { id: { equals: id } },
        },
        req,
      })
      snapshotData = {
        ...result,
        _status: 'draft',
      }
    }

    if (snapshotData) {
      snapshotToSave = deepCopyObjectSimple(snapshotData || {})

      result = mergeLocalizedData({
        configBlockReferences: config.blocks,
        dataWithLocales: result || {},
        docWithLocales: currentDoc || {},
        fields: collectionConfig.fields,
        selectedLocales: [locale],
      })
    }
  }

  const dataToUpdate: JsonObject = { ...result }

  // /////////////////////////////////////
  // Handle potential password update
  // /////////////////////////////////////

  if (shouldSavePassword && typeof password === 'string') {
    const { hash, salt } = await generatePasswordSaltHash({
      collection: collectionConfig,
      password,
      req,
    })
    dataToUpdate.salt = salt
    dataToUpdate.hash = hash
    delete dataToUpdate.password
    delete data.password
  }

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  let resultWithLocales: JsonObject = result

  if (!isSavingDraft) {
    // Ensure updatedAt date is always updated
    dataToUpdate.updatedAt = new Date().toISOString()
    resultWithLocales = await req.payload.db.updateOne({
      id,
      collection: collectionConfig.slug,
      data: dataToUpdate,
      locale,
      req,
    })
  }

  // /////////////////////////////////////
  // Create version
  // /////////////////////////////////////

  if (collectionConfig.versions) {
    resultWithLocales = await saveVersion({
      id,
      autosave,
      collection: collectionConfig,
      docWithLocales: resultWithLocales,
      draft: isSavingDraft,
      operation: 'update',
      payload,
      publishSpecificLocale,
      req,
      snapshot: snapshotToSave,
    })
  }

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await afterRead({
    collection: collectionConfig,
    context: req.context,
    depth,
    doc: resultWithLocales,
    draft: draftArg,
    fallbackLocale,
    global: null,
    locale,
    overrideAccess,
    populate,
    req,
    select,
    showHiddenFields,
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
          overrideAccess,
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
    operation: 'update',
    previousDoc: originalDoc,
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
          operation: 'update',
          overrideAccess,
          previousDoc: originalDoc,
          req,
        })) || result
    }
  }

  return result as TransformCollectionWithSelect<TSlug, TSelect>
}
