import { z } from 'zod'

import type { FindOptions } from '../../collections/operations/find.js'
import type { PaginatedDocs } from '../../database/types.js'
import type {
  DataFromGlobalSlug,
  GlobalSlug,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, PopulateType, SelectType, Sort, Where } from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { APIError } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { globalInput, paginatedInput } from '../../operations/schemaFields.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields.js'

type FindGlobalVersionsArgs = {
  depth?: number
  globalConfig: SanitizedGlobalConfig
  limit?: number
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: Sort
  where?: Where
} & Pick<FindOptions<string, SelectType>, 'select'>

const findGlobalVersions = async <T extends TypeWithVersion<T>>(
  args: FindGlobalVersionsArgs,
): Promise<PaginatedDocs<T>> => {
  const {
    depth,
    globalConfig,
    limit,
    overrideAccess,
    page,
    pagination = true,
    populate,
    select: incomingSelect,
    showHiddenFields,
    sort,
    where,
  } = args
  const req = args.req!
  const { fallbackLocale, locale, payload } = req

  const versionFields = buildVersionGlobalFields(payload.config, globalConfig, true)

  try {
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ req }, globalConfig.access.readVersions)
      : true

    await validateQueryPaths({
      globalConfig,
      overrideAccess: overrideAccess!,
      req,
      versionFields,
      where: where!,
    })

    const fullWhere = combineQueries(where!, accessResults)

    const select = sanitizeSelect({
      fields: buildVersionGlobalFields(payload.config, globalConfig, true),
      select: resolveSelect({
        config: globalConfig.select,
        operation: 'read',
        req,
        select: incomingSelect,
      }),
      versions: true,
    })

    // /////////////////////////////////////
    // Find
    // /////////////////////////////////////

    const usePagination = pagination && limit !== 0
    const sanitizedLimit = limit ?? (usePagination ? 10 : 0)
    const sanitizedPage = page || 1

    const paginatedDocs = await payload.db.findGlobalVersions<T>({
      global: globalConfig.slug,
      limit: sanitizedLimit,
      locale: locale!,
      page: sanitizedPage,
      pagination,
      req,
      select,
      sort,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    let result = {
      ...paginatedDocs,
      docs: await Promise.all(
        paginatedDocs.docs.map(async (data) => {
          if (!data.version) {
            // Fallback if not selected
            ;(data as any).version = {}
          }
          return {
            ...data,
            version: await afterRead<T>({
              collection: null,
              context: req.context,
              depth: depth!,
              doc: {
                ...data.version,
                // Patch globalType onto version doc
                globalType: globalConfig.slug,
              },
              draft: undefined!,
              fallbackLocale: fallbackLocale!,
              findMany: true,
              global: globalConfig,
              locale: locale!,
              overrideAccess: overrideAccess!,
              populate,
              req,
              select,
              showHiddenFields: showHiddenFields!,
            }),
          }
        }),
      ),
    } as PaginatedDocs<T>

    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.afterRead?.length) {
      result.docs = await Promise.all(
        result.docs.map(async (doc) => {
          const docRef = doc

          for (const hook of globalConfig.hooks.afterRead) {
            docRef.version =
              (await hook({
                context: req.context,
                doc: doc.version,
                findMany: true,
                global: globalConfig,
                overrideAccess,
                query: fullWhere,
                req,
              })) || doc.version
          }

          return docRef
        }),
      )
    }

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    result = {
      ...result,
      docs: result.docs.map((doc) => sanitizeInternalFields<T>(doc)),
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type FindGlobalVersionsLocalMethod = <TSlug extends GlobalSlug>(
  options: LocalAPIOptions<FindGlobalVersionsOptions<TSlug>>,
) => Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<TSlug>>>>

const findGlobalVersionsSchema = z.looseObject({
  ...globalInput,
  ...paginatedInput,
  showHiddenFields: z.boolean().optional(),
})

export const findGlobalVersionsLocalAPI = defineLocalAPI<FindGlobalVersionsLocalMethod>()({
  name: 'findGlobalVersions',
})

export const findVersions = defineOperation({
  action: 'findVersions',
  expose: {
    local: findGlobalVersionsLocalAPI,
    mcp: { name: 'findGlobalVersions' },
    rest: [
      {
        method: 'get',
        path: '/versions',
      },
    ],
  },
  handler: findGlobalVersionsHandler,
  input: findGlobalVersionsSchema,
  target: 'global',
})

export type FindGlobalVersionsOptions<TSlug extends GlobalSlug> = {
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
   * The maximum related documents to be returned.
   * Defaults unless `defaultLimit` is specified for the collection config
   * @default 10
   */
  limit?: number
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
   * Get a specific page number
   * @default 1
   */
  page?: number
  /**
   * Set to `false` to return all documents and avoid querying for document counts which introduces some overhead.
   * You can also combine that property with a specified `limit` to limit documents but avoid the count query.
   */
  pagination?: boolean
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
   * the Global slug to operate against.
   */
  slug: TSlug
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-version.createdAt' // Sort DESC by createdAt
   * @example ['version.group', '-version.createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
} & Pick<FindOptions<string, SelectType>, 'select'>

async function findGlobalVersionsHandler<TSlug extends GlobalSlug>(
  payload: Payload,
  options: FindGlobalVersionsOptions<TSlug>,
): Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<TSlug>>>> {
  const {
    slug: globalSlug,
    depth,
    limit,
    overrideAccess = true,
    page,
    pagination = true,
    populate,
    select,
    showHiddenFields,
    sort,
    where,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return findGlobalVersions({
    depth,
    globalConfig,
    limit,
    overrideAccess,
    page,
    pagination,
    populate,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    select,
    showHiddenFields,
    sort,
    where,
  })
}
