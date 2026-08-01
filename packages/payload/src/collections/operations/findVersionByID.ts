import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type {
  CollectionSlug,
  DataFromCollectionSlug,
  FindOptions,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { Collection, DraftFlagFromCollectionSlug, TypeWithID } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { collectionInput } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

type FindDocumentVersionByIDArgs = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  id: number | string
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
  trash?: boolean
} & Pick<FindOptions<string, SelectType>, 'select'>

export const findDocumentVersionByID = async <TData extends TypeWithID = any>(
  args: FindDocumentVersionByIDArgs,
): Promise<TypeWithVersion<TData>> => {
  const {
    id,
    collection: { config: collectionConfig },
    currentDepth,
    depth,
    disableErrors,
    overrideAccess,
    populate,
    req: { fallbackLocale, locale, payload },
    req,
    select: incomingSelect,
    showHiddenFields,
    trash = false,
  } = args

  if (!id) {
    throw new APIError('Missing ID of version.', httpStatus.BAD_REQUEST)
  }

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: collectionConfig,
      operation: 'findVersionByID',
      overrideAccess,
    })

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, disableErrors, req }, collectionConfig.access.readVersions)
      : true

    // If errors are disabled, and access returns false, return null
    if (accessResults === false) {
      return null!
    }

    const hasWhereAccess = typeof accessResults === 'object'

    const where = { id: { equals: id } }

    let fullWhere = combineQueries(where, accessResults)

    fullWhere = appendNonTrashedFilter({
      deletedAtPath: 'version.deletedAt',
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    const select = sanitizeSelect({
      fields: buildVersionCollectionFields(payload.config, collectionConfig, true),
      select: resolveSelect({
        config: collectionConfig.select,
        operation: 'read',
        req,
        select: incomingSelect,
      }),
      versions: true,
    })

    const versionsQuery = await payload.db.findVersions<TData>({
      collection: collectionConfig.slug,
      limit: 1,
      locale: locale!,
      pagination: false,
      req,
      select,
      where: fullWhere,
    })

    let result = versionsQuery.docs[0]!

    if (!result) {
      if (!disableErrors) {
        if (!hasWhereAccess) {
          throw new NotFound(req.t)
        }
        if (hasWhereAccess) {
          throw new Forbidden(req.t)
        }
      }

      return null!
    }

    if (!result.version) {
      // Fallback if not selected
      ;(result as any).version = {}
    }

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeRead?.length) {
      for (const hook of collectionConfig.hooks.beforeRead) {
        result.version =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result.version,
            overrideAccess,
            query: fullWhere,
            req,
          })) || result.version
      }
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result.version = await afterRead({
      collection: collectionConfig,
      context: req.context,
      currentDepth,
      depth: depth!,
      doc: result.version,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      draft: undefined,
      fallbackLocale: fallbackLocale!,
      global: null,
      locale: locale!,
      overrideAccess: overrideAccess!,
      populate,
      req,
      select: typeof select?.version === 'object' ? select.version : undefined,
      showHiddenFields: showHiddenFields!,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterRead?.length) {
      for (const hook of collectionConfig.hooks.afterRead) {
        result.version =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result.version,
            overrideAccess,
            query: fullWhere,
            req,
          })) || result.version
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'findVersionByID',
      overrideAccess,
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type FindVersionByIDLocalMethod = <TSlug extends CollectionSlug>(
  options: LocalAPIOptions<FindVersionByIDOptions<TSlug>>,
) => Promise<TypeWithVersion<DataFromCollectionSlug<TSlug>>>

const findVersionByIDSchema = z.looseObject({
  ...collectionInput,
  id: z.string().describe('The version ID'),
  showHiddenFields: z.boolean().optional(),
  trash: z.boolean().describe('Include versions of soft-deleted documents').optional(),
})

export const findVersionByIDLocalAPI = defineLocalAPI<FindVersionByIDLocalMethod>()({
  name: 'findVersionByID',
})

export const findVersionByID = defineOperation({
  action: 'findVersionByID',
  expose: {
    local: findVersionByIDLocalAPI,
    mcp: { name: 'findVersionByID' },
    rest: [
      {
        method: 'get',
        path: '/versions/:id',
      },
    ],
  },
  handler: async <TSlug extends CollectionSlug>(
    payload: Payload,
    options: FindVersionByIDOptions<TSlug>,
  ): Promise<TypeWithVersion<DataFromCollectionSlug<TSlug>>> => {
    const {
      id,
      collection: collectionSlug,
      depth,
      disableErrors = false,
      overrideAccess = true,
      populate,
      select,
      showHiddenFields,
      trash = false,
    } = options

    const collection = payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError(
        `The collection with slug ${String(
          collectionSlug,
        )} can't be found. Find Version By ID Operation.`,
      )
    }

    return findDocumentVersionByID({
      id,
      collection,
      depth,
      disableErrors,
      overrideAccess,
      populate,
      req: await createLocalReq(options as CreateLocalReqOptions, payload),
      select,
      showHiddenFields,
      trash,
    })
  },
  input: findVersionByIDSchema,
  target: 'collection',
})

type FindVersionByIDOptionsBase<TSlug extends CollectionSlug> = {
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
   * When set to `true`, errors will not be thrown.
   * `null` will be returned instead, if the document on this ID was not found.
   */
  disableErrors?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * The ID of the version to find.
   */
  id: number | string
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: 'all' | TypedLocale
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
   * When set to `true`, the operation will return a document by ID, even if it is trashed (soft-deleted).
   * By default (`false`), the operation will exclude trashed documents.
   * To fetch a trashed document, set `trash: true`.
   *
   * This argument has no effect unless `trash` is enabled on the collection.
   * @default false
   */
  trash?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<TSlug, SelectType>, 'select'>

export type FindVersionByIDOptions<TSlug extends CollectionSlug> =
  DraftFlagFromCollectionSlug<TSlug> & FindVersionByIDOptionsBase<TSlug>
