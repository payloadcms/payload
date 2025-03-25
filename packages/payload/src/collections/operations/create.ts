// @ts-strict-ignore
import crypto from 'crypto'

import type {
  Document,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type {
  AfterChangeHook,
  BeforeOperationHook,
  BeforeValidateHook,
  Collection,
  DataFromCollectionSlug,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import { ensureUsernameOrEmail } from '../../auth/ensureUsernameOrEmail.js'
import executeAccess from '../../auth/executeAccess.js'
import { sendVerificationEmail } from '../../auth/sendVerificationEmail.js'
import { registerLocalStrategy } from '../../auth/strategies/local/register.js'
import { getDuplicateDocumentData } from '../../duplicateDocument/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { type CollectionSlug, type JsonObject } from '../../index.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { uploadFiles } from '../../uploads/uploadFiles.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { saveVersion } from '../../versions/saveVersion.js'
import { buildAfterOperation } from './utils.js'

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
  req: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
}

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

    if (args.collection.config.hooks.beforeOperation?.length) {
      for (const hook of args.collection.config.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            collection: args.collection.config,
            context: args.req.context,
            operation: 'create',
            req: args.req,
          })) || args
      }
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
      req: {
        fallbackLocale,
        locale,
        payload,
        payload: { config },
      },
      req,
      select: incomingSelect,
      showHiddenFields,
    } = args

    let { data } = args

    const shouldSaveDraft = Boolean(draft && collectionConfig.versions.drafts)

    let duplicatedFromDocWithLocales: JsonObject = {}
    let duplicatedFromDoc: JsonObject = {}

    if (duplicateFromID) {
      const duplicateResult = await getDuplicateDocumentData({
        id: duplicateFromID,
        collectionConfig,
        draftArg: shouldSaveDraft,
        overrideAccess,
        req,
        shouldSaveDraft,
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
        !shouldSaveDraft && collection.config.upload.filesRequiredOnCreate !== false,
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
      overrideAccess,
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
      req,
      skipValidation:
        shouldSaveDraft &&
        collectionConfig.versions.drafts &&
        !collectionConfig.versions.drafts.validate,
    })

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
        select,
      })
    } else {
      doc = await payload.db.create({
        collection: collectionConfig.slug,
        data: resultWithLocales,
        req,
        select,
      })
    }

    const verificationToken = doc._verificationToken
    let result: Document = sanitizeInternalFields(doc)

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////

    if (collectionConfig.versions) {
      await saveVersion({
        id: result.id,
        autosave,
        collection: collectionConfig,
        docWithLocales: result,
        payload,
        req,
      })
    }

    // /////////////////////////////////////
    // Send verification email if applicable
    // /////////////////////////////////////

    if (collectionConfig.auth && collectionConfig.auth.verify && result.email) {
      await sendVerificationEmail({
        collection: { config: collectionConfig },
        config: payload.config,
        disableEmail: disableVerificationEmail,
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
      depth,
      doc: result,
      draft,
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
