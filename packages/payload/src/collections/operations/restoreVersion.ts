import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type { FindOneArgs } from '../../database/types.js'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { JsonObject, PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type { Collection, DraftFlagFromCollectionSlug, TypeWithID } from '../config/types.js'
import type { FindOptions } from './find.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { collectionInput } from '../../operations/schemaFields.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { hasDraftValidationEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'
import { saveVersion } from '../../versions/saveVersion.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

type RestoreDocumentVersionArgs = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  disableTransaction?: boolean
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
} & Pick<FindOptions<string, SelectType>, 'select'>

export const restoreDocumentVersion = async <
  TData extends JsonObject & TypeWithID = JsonObject & TypeWithID,
>(
  args: RestoreDocumentVersionArgs,
): Promise<TData> => {
  const {
    id,
    collection: { config: collectionConfig },
    depth,
    draft: draftArg = false,
    overrideAccess = false,
    populate,
    req,
    req: { fallbackLocale, locale, payload },
    select: incomingSelect,
    showHiddenFields,
  } = args

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(args.req))

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'restoreVersion',
      overrideAccess,
    })

    if (!id) {
      throw new APIError('Missing ID of version to restore.', httpStatus.BAD_REQUEST)
    }

    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////

    const { docs: versionDocs } = await req.payload.db.findVersions({
      collection: collectionConfig.slug,
      limit: 1,
      locale: 'all',
      pagination: false,
      req,
      where: { id: { equals: id } },
    })

    const [rawVersionToRestore] = versionDocs

    if (!rawVersionToRestore) {
      throw new NotFound(req.t)
    }

    const { parent: parentDocID, version: versionToRestoreWithLocales } = rawVersionToRestore

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id: parentDocID, req }, collectionConfig.access.update)
      : true
    const hasWherePolicy = hasWhereAccessResult(accessResults)

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////

    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      locale: 'all',
      req,
      where: combineQueries({ id: { equals: parentDocID } }, accessResults),
    }

    // Get the document from the non versioned collection
    const doc = await req.payload.db.findOne<TData>(findOneArgs)

    if (!doc && !hasWherePolicy) {
      throw new NotFound(req.t)
    }
    if (!doc && hasWherePolicy) {
      throw new Forbidden(req.t)
    }

    if (collectionConfig.trash && doc?.deletedAt) {
      throw new APIError(
        `Cannot restore a version of a trashed document (ID: ${parentDocID}). Restore the document first.`,
        httpStatus.FORBIDDEN,
      )
    }

    // /////////////////////////////////////
    // fetch previousDoc
    // /////////////////////////////////////
    const prevDocWithLocales = await getLatestCollectionVersion({
      id: parentDocID,
      config: collectionConfig,
      payload,
      query: findOneArgs,
      req,
    })

    // originalDoc with hoisted localized data
    const validationLocale = payload.config.localization
      ? payload.config.localization.defaultLocale
      : locale!

    const originalDoc = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: 0,
      doc: deepCopyObjectSimple(prevDocWithLocales),
      draft: draftArg,
      fallbackLocale: null,
      global: null,
      locale: validationLocale,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    })

    // Use locale-hoisted version data for validation while preserving all locales in docWithLocales.
    const prevVersionDoc = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: 0,
      doc: deepCopyObjectSimple(rawVersionToRestore.version),
      draft: draftArg,
      fallbackLocale: null,
      global: null,
      locale: validationLocale,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    })

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    req.context.isRestoringVersion = true

    const reqWithValidationLocale = isolateObjectProperty(req, ['fallbackLocale', 'locale'])
    reqWithValidationLocale.fallbackLocale = null
    reqWithValidationLocale.locale = validationLocale

    let data = await beforeValidate({
      id: parentDocID,
      collection: collectionConfig,
      context: req.context,
      data: deepCopyObjectSimple(prevVersionDoc),
      doc: originalDoc,
      global: null,
      operation: 'update',
      overrideAccess,
      req: reqWithValidationLocale,
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
            req: reqWithValidationLocale,
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
            operation: 'update',
            originalDoc,
            req: reqWithValidationLocale,
          })) || data
      }
    }

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    let result = await beforeChange({
      id: parentDocID,
      collection: collectionConfig,
      context: req.context,
      data: { ...data, id: parentDocID },
      doc: originalDoc,
      docWithLocales: versionToRestoreWithLocales,
      global: null,
      operation: 'update',
      overrideAccess,
      req: reqWithValidationLocale,
      skipValidation: draftArg && !hasDraftValidationEnabled(collectionConfig),
    })

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    const select = sanitizeSelect({
      fields: collectionConfig.flattenedFields,
      select: resolveSelect({
        config: collectionConfig.select,
        operation: 'restoreVersion',
        req,
        select: incomingSelect,
      }),
    })

    // Ensure updatedAt date is always updated
    result.updatedAt = new Date().toISOString()
    // Ensure status respects restoreAsDraft arg
    result._status = draftArg ? 'draft' : result._status
    if (!draftArg) {
      result = await req.payload.db.updateOne({
        id: parentDocID,
        collection: collectionConfig.slug,
        data: result,
        req: reqWithValidationLocale,
        select,
      })
    }

    // /////////////////////////////////////
    // Save restored doc as a new version
    // /////////////////////////////////////

    result = await saveVersion({
      id: parentDocID,
      autosave: false,
      collection: collectionConfig,
      docWithLocales: result,
      draft: draftArg,
      operation: 'restoreVersion',
      payload,
      req: reqWithValidationLocale,
      select,
    })

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: depth!,
      doc: result,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      draft: undefined,
      fallbackLocale: fallbackLocale!,
      global: null,
      locale: locale!,
      overrideAccess,
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
      data: result,
      doc: result,
      global: null,
      operation: 'update',
      previousDoc: prevDocWithLocales,
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
            data: result,
            doc: result,
            operation: 'update',
            overrideAccess,
            previousDoc: prevDocWithLocales,
            req,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'restoreVersion',
      overrideAccess,
      result,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type RestoreVersionLocalMethod = <TSlug extends CollectionSlug>(
  options: LocalAPIOptions<RestoreVersionOptions<TSlug>>,
) => Promise<DataFromCollectionSlug<TSlug>>

const restoreVersionSchema = z.looseObject({
  ...collectionInput,
  id: z.string().describe('The version ID to restore'),
  draft: z.boolean().describe('Restore the version as a draft').optional().default(false),
  showHiddenFields: z.boolean().optional(),
})

export const restoreVersionLocalAPI = defineLocalAPI<RestoreVersionLocalMethod>()({
  name: 'restoreVersion',
})

export const restoreVersion = defineOperation({
  action: 'restoreVersion',
  expose: {
    local: restoreVersionLocalAPI,
    mcp: { name: 'restoreVersion' },
    rest: [
      {
        method: 'post',
        path: '/versions/:id',
      },
    ],
  },
  handler: async <TSlug extends CollectionSlug>(
    payload: Payload,
    options: RestoreVersionOptions<TSlug>,
  ): Promise<DataFromCollectionSlug<TSlug>> => {
    const {
      id,
      collection: collectionSlug,
      depth,
      overrideAccess = true,
      populate,
      select,
      showHiddenFields,
    } = options

    const collection = payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError(
        `The collection with slug ${String(
          collectionSlug,
        )} can't be found. Restore Version Operation.`,
      )
    }

    return restoreDocumentVersion({
      id,
      collection,
      depth,
      overrideAccess,
      populate,
      req: await createLocalReq(options as CreateLocalReqOptions, payload),
      select,
      showHiddenFields,
    })
  },
  input: restoreVersionSchema,
  target: 'collection',
})

type RestoreVersionOptionsBase<TSlug extends CollectionSlug> = {
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
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * The ID of the version to restore.
   */
  id: number | string
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
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType
  /**
   * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
   * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
   */
  req?: Partial<PayloadRequest>
  /**
   * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
   * @default false
   */
  showHiddenFields?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<TSlug, SelectType>, 'select'>

export type RestoreVersionOptions<TSlug extends CollectionSlug> = DraftFlagFromCollectionSlug<TSlug> &
  RestoreVersionOptionsBase<TSlug>
