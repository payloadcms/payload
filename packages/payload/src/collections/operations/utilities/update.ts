import type { DeepPartial } from 'ts-essentials'

import type { Args } from '../../../fields/hooks/beforeChange/index.js'
import type {
  AccessResult,
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
import { combineQueries } from '../../../database/combineQueries.js'
import { afterChange } from '../../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple, saveVersion } from '../../../index.js'
import { deleteAssociatedFiles } from '../../../uploads/deleteAssociatedFiles.js'
import { uploadFiles } from '../../../uploads/uploadFiles.js'
import { checkDocumentLockStatus } from '../../../utilities/checkDocumentLockStatus.js'
import {
  hasDraftsEnabled,
  hasDraftValidationEnabled,
} from '../../../utilities/getVersionsConfig.js'
import { getLatestCollectionVersion } from '../../../versions/getLatestCollectionVersion.js'

export type SharedUpdateDocumentArgs<TSlug extends CollectionSlug> = {
  accessResults: AccessResult
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
  publishSpecificLocale?: string
  req: PayloadRequest
  select: SelectType
  showHiddenFields: boolean
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
  accessResults,
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
  publishSpecificLocale,
  req,
  select,
  showHiddenFields,
}: SharedUpdateDocumentArgs<TSlug>): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
  const password = data?.password
  const isSavingDraft =
    Boolean(draftArg && hasDraftsEnabled(collectionConfig)) && data._status !== 'published'
  const shouldSavePassword = Boolean(
    password &&
      collectionConfig.auth &&
      (!collectionConfig.auth.disableLocalStrategy ||
        (typeof collectionConfig.auth.disableLocalStrategy === 'object' &&
          collectionConfig.auth.disableLocalStrategy.enableFields)) &&
      !isSavingDraft,
  )

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

  let result: JsonObject = await beforeChange(beforeChangeArgs)
  let snapshotToSave: JsonObject | undefined

  if (config.localization && collectionConfig.versions) {
    if (publishSpecificLocale) {
      snapshotToSave = deepCopyObjectSimple(result)

      // the published data to save to the main document
      result = await beforeChange({
        ...beforeChangeArgs,
        docWithLocales:
          (await getLatestCollectionVersion({
            id,
            config: collectionConfig,
            payload,
            published: true,
            query: {
              collection: collectionConfig.slug,
              locale,
              req,
              where: combineQueries({ id: { equals: id } }, accessResults),
            },
            req,
          })) || {},
      })
    }
  }

  // /////////////////////////////////////
  // Handle potential password update
  // /////////////////////////////////////

  const dataToUpdate: JsonObject = { ...result }

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
      docWithLocales: result,
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
          docWithLocales: resultWithLocales,
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
          docWithLocales: resultWithLocales,
          operation: 'update',
          previousDoc: originalDoc,
          previousDocWithLocales: docWithLocales,
          req,
        })) || result
    }
  }

  return result as TransformCollectionWithSelect<TSlug, TSelect>
}
