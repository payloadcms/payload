import type { I18n } from '@payloadcms/translations'

import crypto from 'crypto'
import { z } from 'zod'

import type { SanitizedCollectionPermission } from '../../auth/types.js'
import type {
  CollectionSlug,
  FindOptions,
  GeneratedTypes,
  JsonObject,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type {
  Document,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type { File } from '../../uploads/types.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type {
  Collection,
  CollectionsWithoutDrafts,
  DataFromCollectionSlug,
  DraftDataFromCollectionSlug,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import { ensureUsernameOrEmail } from '../../auth/ensureUsernameOrEmail.js'
import { executeAccess } from '../../auth/executeAccess.js'
import { sendVerificationEmail } from '../../auth/sendVerificationEmail.js'
import { registerLocalStrategy } from '../../auth/strategies/local/register.js'
import { getDuplicateDocumentData } from '../../duplicateDocument/index.js'
import { APIError } from '../../errors/index.js'
import { fillEmptyLocalizedSlugs } from '../../fields/baseFields/slug/fillEmptyLocalizedSlugs.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple, saveVersion } from '../../index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import {
  getCollectionOperationInputSchema,
  validateCollectionOperationData,
} from '../../operations/entitySchema.js'
import { prepareCollectionOperationData } from '../../operations/prepareData.js'
import { collectionInput, dataSchema } from '../../operations/schemaFields.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import { getFileByPath } from '../../uploads/getFileByPath.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { uploadFiles } from '../../uploads/uploadFiles.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import {
  hasDraftsEnabled,
  hasDraftValidationEnabled,
  hasLocalizeStatusEnabled,
} from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

type CreateDocumentArgs<TSlug extends CollectionSlug> = {
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

export const createDocument = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: CreateDocumentArgs<TSlug>,
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
      await executeAccess({ data, req }, collectionConfig.access.create)
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

    const select = sanitizeSelect({
      fields: collectionConfig.flattenedFields,
      select: resolveSelect({
        config: collectionConfig.select,
        operation: 'create',
        req,
        select: incomingSelect,
      }),
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
            overrideAccess,
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

type CreateLocalMethod = <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  options: LocalAPIOptions<CreateOptions<TSlug, TSelect>>,
) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>

const createSchema = z
  .looseObject({
    ...collectionInput,
    autosave: z.boolean().optional(),
    data: dataSchema,
    draft: z.boolean().describe('Create the document as a draft').optional().default(false),
    publishAllLocales: z.boolean().optional(),
  })
  .overwrite((input) => {
    const payload = (input.req as PayloadRequest | undefined)?.payload

    if (!payload) {
      return input
    }

    const data = prepareCollectionOperationData({
      collection: input.collection,
      config: payload.config,
      data: input.data,
    })

    validateCollectionOperationData({
      collection: input.collection,
      data,
      i18n: (input.req as { i18n?: I18n } | undefined)?.i18n,
      payload,
    })

    return { ...input, data }
  })

export const createLocalAPI = defineLocalAPI<CreateLocalMethod>()({ name: 'create' })

export const create = defineOperation({
  action: 'create',
  expose: {
    local: createLocalAPI,
    mcp: { name: 'createDocuments' },
    rest: [
      {
        method: 'post',
        path: '/',
      },
    ],
  },
  getDataSchema: ({ context: payload, input, permissions }) =>
    getCollectionOperationInputSchema({
      collection: input.collection,
      i18n: (input.req as { i18n?: I18n } | undefined)?.i18n,
      payload,
      permissions: permissions as SanitizedCollectionPermission | undefined,
    }),
  handler: async <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    payload: Payload,
    options: CreateOptions<TSlug, TSelect>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
    const {
      autosave,
      collection: collectionSlug,
      data,
      depth,
      disableTransaction,
      disableVerificationEmail,
      draft,
      duplicateFromID,
      file,
      filePath,
      overrideAccess = true,
      overwriteExistingFiles = false,
      populate,
      publishAllLocales,
      select,
      selectedLocales,
      showHiddenFields,
    } = options

    const collection = payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError(
        `The collection with slug ${String(collectionSlug)} can't be found. Create Operation.`,
      )
    }

    const req = await createLocalReq(options as CreateLocalReqOptions, payload)

    req.file = file ?? (await getFileByPath(filePath!))

    return createDocument<TSlug, TSelect>({
      autosave,
      collection,
      data: deepCopyObjectSimple(data),
      depth,
      disableTransaction,
      disableVerificationEmail,
      draft,
      duplicateFromID,
      overrideAccess,
      overwriteExistingFiles,
      populate,
      publishAllLocales,
      req,
      select,
      selectedLocales,
      showHiddenFields,
    })
  },
  input: createSchema,
  target: 'collection',
})

type CreateOptionsBase<TSlug extends CollectionSlug, TSelect extends SelectType> = {
  /**
   * Whether the current create should be marked as from autosave.
   * `versions.drafts.autosave` should be specified.
   */
  autosave?: boolean
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
   * which can be read by hooks. Useful if you want to pass additional information to the hooks which
   * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
   * to determine if it should run or not.
   */
  context?: RequestContext
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * When set to `true`, a [database transactions](https://payloadcms.com/docs/database/transactions) will not be initialized.
   * @default false
   */
  disableTransaction?: boolean
  /**
   * If creating verification-enabled auth doc,
   * you can disable the email that is auto-sent
   */
  disableVerificationEmail?: boolean
  /**
   * If you want to create a document that is a duplicate of another document
   */
  duplicateFromID?: DataFromCollectionSlug<TSlug>['id']
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * A `File` object when creating a collection with `upload: true`.
   */
  file?: File
  /**
   * A file path when creating a collection with `upload: true`.
   */
  filePath?: string
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: TypedLocale
  /**
   * Skip access control.
   * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
   * @default true
   */
  overrideAccess?: boolean
  /**
   * If you are uploading a file and would like to replace
   * the existing file instead of generating a new filename,
   * you can set the following property to `true`
   */
  overwriteExistingFiles?: boolean
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType
  /**
   * Publish to all locales
   */
  publishAllLocales?: boolean
  /**
   * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
   * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
   */
  req?: Partial<PayloadRequest>
  /**
   * Restrict localized values copied while duplicating a document.
   */
  selectedLocales?: string[]
  /**
   * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
   * @default false
   */
  showHiddenFields?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<TSlug, TSelect>, 'select'>

export type CreateOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectType,
> = GeneratedTypes extends { strictDraftTypes: true }
  ? CollectionsWithoutDrafts extends TSlug
    ? {
        /**
         * The data for the document to create.
         */
        data: DataFromCollectionSlug<TSlug>
        /**
         * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
         */
        draft?: boolean
      } & CreateOptionsBase<TSlug, TSelect>
    : TSlug extends CollectionsWithoutDrafts
      ? {
          data: RequiredDataFromCollectionSlug<TSlug>
          /**
           * The `draft` property is not allowed because this collection does not have `versions.drafts` enabled.
           */
          draft?: never
        } & CreateOptionsBase<TSlug, TSelect>
      : (
          | {
              /**
               * The data for the document to create.
               */
              data: RequiredDataFromCollectionSlug<TSlug>
              /**
               * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
               * Omit this property or set to `false` to create a published document.
               */
              draft?: false
            }
          | {
              /**
               * The data for the document to create.
               * When creating a draft, required fields are optional as validation is skipped by default.
               */
              data: DraftDataFromCollectionSlug<TSlug>
              /**
               * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
               */
              draft: true
            }
        ) &
          CreateOptionsBase<TSlug, TSelect>
  :
      | ({
          /**
           * The data for the document to create.
           */
          data: RequiredDataFromCollectionSlug<TSlug>
          /**
           * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
           */
          draft?: false
        } & CreateOptionsBase<TSlug, TSelect>)
      | ({
          /**
           * The data for the document to create.
           * When creating a draft, required fields are optional as validation is skipped by default.
           */
          data: DraftDataFromCollectionSlug<TSlug>
          /**
           * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
           */
          draft: true
        } & CreateOptionsBase<TSlug, TSelect>)
