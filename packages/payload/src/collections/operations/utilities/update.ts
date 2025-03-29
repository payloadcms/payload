// @ts-strict-ignore
import type { DeepPartial } from 'ts-essentials'

import type { Args } from '../../../fields/hooks/beforeChange/index.js'
import type {
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
} from '../../config/types.js'

import { ensureUsernameOrEmail } from '../../../auth/ensureUsernameOrEmail.js'
import { generatePasswordSaltHash } from '../../../auth/strategies/local/generatePasswordSaltHash.js'
import { combineQueries } from '../../../database/combineQueries.js'
import { afterChange } from '../../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../../fields/hooks/beforeValidate/index.js'
import {
  type AccessResult,
  type CollectionSlug,
  deepCopyObjectSimple,
  type FileToSave,
  type SanitizedConfig,
} from '../../../index.js'
import { deleteAssociatedFiles } from '../../../uploads/deleteAssociatedFiles.js'
import { uploadFiles } from '../../../uploads/uploadFiles.js'
import { checkDocumentLockStatus } from '../../../utilities/checkDocumentLockStatus.js'
import { getLatestCollectionVersion } from '../../../versions/getLatestCollectionVersion.js'
import { saveVersion } from '../../../versions/saveVersion.js'

export type SharedUpdateDocumentArgs<TSlug extends CollectionSlug> = {
  accessResults: AccessResult
  autosave: boolean
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  data: DeepPartial<DataFromCollectionSlug<TSlug>>
  depth: number
  docWithLocales: any
  draftArg: boolean
  fallbackLocale: string
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
  const shouldSaveDraft =
    Boolean(draftArg && collectionConfig.versions.drafts) && data._status !== 'published'
  const shouldSavePassword = Boolean(
    password &&
      collectionConfig.auth &&
      (!collectionConfig.auth.disableLocalStrategy ||
        (typeof collectionConfig.auth.disableLocalStrategy === 'object' &&
          collectionConfig.auth.disableLocalStrategy.enableFields)) &&
      !shouldSaveDraft,
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

  let publishedDocWithLocales = docWithLocales
  let versionSnapshotResult

  const beforeChangeArgs: Args<DataFromCollectionSlug<TSlug>> = {
    id,
    collection: collectionConfig,
    context: req.context,
    data: { ...data, id },
    doc: originalDoc,
    docWithLocales: undefined,
    global: null,
    operation: 'update',
    req,
    skipValidation:
      shouldSaveDraft &&
      collectionConfig.versions.drafts &&
      !collectionConfig.versions.drafts.validate,
  }

  if (publishSpecificLocale) {
    versionSnapshotResult = await beforeChange({
      ...beforeChangeArgs,
      docWithLocales,
    })

    const lastPublished = await getLatestCollectionVersion({
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
    })

    publishedDocWithLocales = lastPublished ? lastPublished : {}
  }

  let result = await beforeChange({
    ...beforeChangeArgs,
    docWithLocales: publishedDocWithLocales,
  })

  // /////////////////////////////////////
  // Handle potential password update
  // /////////////////////////////////////

  const dataToUpdate: Record<string, unknown> = { ...result }

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

  if (!shouldSaveDraft) {
    result = await req.payload.db.updateOne({
      id,
      collection: collectionConfig.slug,
      data: dataToUpdate,
      locale,
      req,
      select,
    })
  }

  // /////////////////////////////////////
  // Create version
  // /////////////////////////////////////

  if (collectionConfig.versions) {
    result = await saveVersion({
      id,
      autosave,
      collection: collectionConfig,
      docWithLocales: result,
      draft: shouldSaveDraft,
      payload,
      publishSpecificLocale,
      req,
      select,
      snapshot: versionSnapshotResult,
    })
  }

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await afterRead({
    collection: collectionConfig,
    context: req.context,
    depth,
    doc: result,
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
          doc: result,
          operation: 'update',
          previousDoc: originalDoc,
          req,
        })) || result
    }
  }

  return result as TransformCollectionWithSelect<TSlug, TSelect>
}
