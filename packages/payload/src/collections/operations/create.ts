import type { MarkOptional } from 'ts-essentials'

import crypto from 'crypto'
import fs from 'fs'
import { promisify } from 'util'

import type { GeneratedTypes } from '../../'
import type { PayloadRequest } from '../../express/types'
import type { Document } from '../../types'
import type {
  AfterChangeHook,
  BeforeOperationHook,
  BeforeValidateHook,
  Collection,
} from '../config/types'

import executeAccess from '../../auth/executeAccess'
import sendVerificationEmail from '../../auth/sendVerificationEmail'
import { registerLocalStrategy } from '../../auth/strategies/local/register'
import { ValidationError } from '../../errors'
import { fieldAffectsData } from '../../fields/config/types'
import { afterChange } from '../../fields/hooks/afterChange'
import { afterRead } from '../../fields/hooks/afterRead'
import { beforeChange } from '../../fields/hooks/beforeChange'
import { beforeValidate } from '../../fields/hooks/beforeValidate'
import { generateFileData } from '../../uploads/generateFileData'
import { uploadFiles } from '../../uploads/uploadFiles'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { mapAsync } from '../../utilities/mapAsync'
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields'
import { saveVersion } from '../../versions/saveVersion'
import { buildAfterOperation } from './utils'

const unlinkFile = promisify(fs.unlink)

export type CreateUpdateType = { [field: number | string | symbol]: unknown }

export type Arguments<T extends CreateUpdateType> = {
  autosave?: boolean
  collection: Collection
  data: MarkOptional<T, 'createdAt' | 'id' | 'sizes' | 'updatedAt'>
  depth?: number
  disableVerificationEmail?: boolean
  draft?: boolean
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

async function create<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments<GeneratedTypes['collections'][TSlug]>,
): Promise<GeneratedTypes['collections'][TSlug]> {
  let args = incomingArgs

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(
    async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
      await priorHook

      args =
        (await hook({
          args,
          context: args.req.context,
          operation: 'create',
        })) || args
    },
    Promise.resolve(),
  )

  const {
    autosave = false,
    collection: { config: collectionConfig },
    collection,
    depth,
    disableVerificationEmail,
    draft = false,
    overrideAccess,
    overwriteExistingFiles = false,
    req: {
      payload,
      payload: { config, emailOptions },
    },
    req,
    showHiddenFields,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    let { data } = args

    const shouldSaveDraft = Boolean(draft && collectionConfig.versions.drafts)

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      await executeAccess({ data, req }, collectionConfig.access.create)
    }

    // /////////////////////////////////////
    // Custom id
    // /////////////////////////////////////

    const hasIdField =
      collectionConfig.fields.findIndex((field) => fieldAffectsData(field) && field.name === 'id') >
      -1
    if (hasIdField) {
      data = {
        _id: data.id,
        ...data,
      }
    }

    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////

    const { data: newFileData, files: filesToUpload } = await generateFileData({
      collection,
      config,
      data,
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
      context: req.context,
      data,
      doc: {},
      entityConfig: collectionConfig,
      operation: 'create',
      overrideAccess,
      req,
    })

    // /////////////////////////////////////
    // beforeValidate - Collections
    // /////////////////////////////////////

    await collectionConfig.hooks.beforeValidate.reduce(
      async (priorHook: BeforeValidateHook | Promise<void>, hook: BeforeValidateHook) => {
        await priorHook

        data =
          (await hook({
            context: req.context,
            data,
            operation: 'create',
            req,
          })) || data
      },
      Promise.resolve(),
    )

    // /////////////////////////////////////
    // Write files to local storage
    // /////////////////////////////////////

    if (!collectionConfig.upload.disableLocalStorage) {
      await uploadFiles(payload, filesToUpload, req.t)
    }

    // /////////////////////////////////////
    // beforeChange - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
      await priorHook

      data =
        (await hook({
          context: req.context,
          data,
          operation: 'create',
          req,
        })) || data
    }, Promise.resolve())

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    const resultWithLocales = await beforeChange<Record<string, unknown>>({
      context: req.context,
      data,
      doc: {},
      docWithLocales: {},
      entityConfig: collectionConfig,
      operation: 'create',
      req,
      skipValidation: shouldSaveDraft,
    })

    // /////////////////////////////////////
    // Create
    // /////////////////////////////////////

    let doc

    if (collectionConfig.auth && !collectionConfig.auth.disableLocalStrategy) {
      if (data.email) {
        resultWithLocales.email = (data.email as string).toLowerCase()
      }

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
      try {
        doc = await payload.db.create({
          collection: collectionConfig.slug,
          data: resultWithLocales,
          req,
        })
      } catch (error) {
        // Handle uniqueness error from MongoDB
        throw error.code === 11000 && error.keyValue
          ? new ValidationError(
              [
                {
                  field: Object.keys(error.keyValue)[0],
                  message: req.t('error:valueMustBeUnique'),
                },
              ],
              req.t,
            )
          : error
      }
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

    if (collectionConfig.auth && collectionConfig.auth.verify) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      sendVerificationEmail({
        collection: { config: collectionConfig },
        config: payload.config,
        disableEmail: disableVerificationEmail,
        emailOptions,
        req,
        sendEmail: payload.sendEmail,
        token: verificationToken,
        user: result,
      })
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      context: req.context,
      depth,
      doc: result,
      entityConfig: collectionConfig,
      overrideAccess,
      req,
      showHiddenFields,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook

      result =
        (await hook({
          context: req.context,
          doc: result,
          req,
        })) || result
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterChange - Fields
    // /////////////////////////////////////

    result = await afterChange({
      context: req.context,
      data,
      doc: result,
      entityConfig: collectionConfig,
      operation: 'create',
      previousDoc: {},
      req,
    })

    // Remove temp files if enabled, as express-fileupload does not do this automatically
    if (config.upload?.useTempFiles && collectionConfig.upload) {
      const { files } = req
      const fileArray = Array.isArray(files) ? files : [files]
      await mapAsync(fileArray, async ({ file }) => {
        // Still need this check because this will not be populated if using local API
        if (file.tempFilePath) {
          await unlinkFile(file.tempFilePath)
        }
      })
    }

    // /////////////////////////////////////
    // afterChange - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterChange.reduce(
      async (priorHook: AfterChangeHook | Promise<void>, hook: AfterChangeHook) => {
        await priorHook

        result =
          (await hook({
            context: req.context,
            doc: result,
            operation: 'create',
            previousDoc: {},
            req: args.req,
          })) || result
      },
      Promise.resolve(),
    )

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
      args,
      operation: 'create',
      result,
    })

    // Remove temp files if enabled, as express-fileupload does not do this automatically
    if (config.upload?.useTempFiles && collectionConfig.upload) {
      const { files } = req
      const fileArray = Array.isArray(files) ? files : [files]
      await mapAsync(fileArray, async ({ file }) => {
        // Still need this check because this will not be populated if using local API
        if (file.tempFilePath) {
          await unlinkFile(file.tempFilePath)
        }
      })
    }

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default create
