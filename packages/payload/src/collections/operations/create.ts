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
import { afterChange } from '../../fields/hooks/afterChange'
import { afterRead } from '../../fields/hooks/afterRead'
import { beforeChange } from '../../fields/hooks/beforeChange'
import { beforeValidate } from '../../fields/hooks/beforeValidate'
import { generateFileData } from '../../uploads/generateFileData'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles'
import { uploadFiles } from '../../uploads/uploadFiles'
import { commitTransaction } from '../../utilities/commitTransaction'
import flattenFields from '../../utilities/flattenTopLevelFields'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
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

  try {
    const shouldCommit = await initTransaction(args.req)

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(
      async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
        await priorHook

        args =
          (await hook({
            args,
            collection: args.collection.config,
            context: args.req.context,
            operation: 'create',
            req: args.req,
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
        fallbackLocale,
        locale,
        payload,
        payload: { config, emailOptions },
      },
      req,
      showHiddenFields,
    } = args

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
    // @todo: Refactor code to store 'customId' on the collection configuration itself so we don't need to repeat flattenFields
    const hasIdField =
      flattenFields(collectionConfig.fields).findIndex((field) => field.name === 'id') > -1

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
      operation: 'create',
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
      doc: {},
      global: null,
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
            collection: collectionConfig,
            context: req.context,
            data,
            operation: 'create',
            req,
          })) || data
      },
      Promise.resolve(),
    )

    // /////////////////////////////////////
    // beforeChange - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
      await priorHook

      data =
        (await hook({
          collection: collectionConfig,
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
      collection: collectionConfig,
      context: req.context,
      data,
      doc: {},
      docWithLocales: {},
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
      await uploadFiles(payload, filesToUpload, req.t)
    }

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
      const dbArgs = {
        collection: collectionConfig.slug,
        data: resultWithLocales,
        req,
      }
      if (collectionConfig?.db?.create) {
        doc = await collectionConfig.db.create(dbArgs)
      } else {
        doc = await payload.db.create(dbArgs)
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
      collection: collectionConfig,
      context: req.context,
      depth,
      doc: result,
      draft,
      fallbackLocale,
      global: null,
      locale,
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
          collection: collectionConfig,
          context: req.context,
          doc: result,
          req,
        })) || result
    }, Promise.resolve())

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

    await collectionConfig.hooks.afterChange.reduce(
      async (priorHook: AfterChangeHook | Promise<void>, hook: AfterChangeHook) => {
        await priorHook

        result =
          (await hook({
            collection: collectionConfig,
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
      collection: collectionConfig,
      operation: 'create',
      result,
    })

    await unlinkTempFiles({ collectionConfig, config, req })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

export default create
