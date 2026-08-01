import { z } from 'zod'

import type { FindOptions } from '../../collections/operations/find.js'
import type { FindGlobalVersionsArgs } from '../../database/types.js'
import type {
  DataFromGlobalSlug,
  GlobalSlug,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { globalInput } from '../../operations/schemaFields.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields.js'

type FindGlobalVersionByIDArgs = {
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  globalConfig: SanitizedGlobalConfig
  id: number | string
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
} & Pick<FindOptions<string, SelectType>, 'select'>

const findGlobalVersionByID = async <T extends TypeWithVersion<T> = any>(
  args: FindGlobalVersionByIDArgs,
): Promise<T> => {
  const {
    id,
    currentDepth,
    depth,
    disableErrors,
    globalConfig,
    overrideAccess,
    populate,
    req: { fallbackLocale, locale, payload },
    req,
    select: incomingSelect,
    showHiddenFields,
  } = args

  try {
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, disableErrors, req }, globalConfig.access.readVersions)
      : true

    // If errors are disabled, and access returns false, return null
    if (accessResults === false) {
      return null!
    }

    const hasWhereAccess = typeof accessResults === 'object'

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

    const findGlobalVersionsArgs: FindGlobalVersionsArgs = {
      global: globalConfig.slug,
      limit: 1,
      locale: locale!,
      req,
      select,
      where: combineQueries({ id: { equals: id } }, accessResults),
    }

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    if (!findGlobalVersionsArgs.where?.and?.[0]?.id) {
      throw new NotFound(req.t)
    }

    const { docs: results } = await payload.db.findGlobalVersions(findGlobalVersionsArgs)
    if (!results || results?.length === 0) {
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

    // Clone the result - it may have come back memoized
    let result: any = deepCopyObjectSimple(results[0])

    if (!result.version) {
      result.version = {}
    }

    // Patch globalType onto version doc
    result.version.globalType = globalConfig.slug

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    if (globalConfig.hooks?.beforeRead?.length) {
      for (const hook of globalConfig.hooks.beforeRead) {
        result =
          (await hook({
            context: req.context,
            doc: result.version,
            global: globalConfig,
            overrideAccess,
            req,
          })) || result.version
      }
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result.version = await afterRead({
      collection: null,
      context: req.context,
      currentDepth,
      depth: depth!,
      doc: result.version,
      draft: undefined!,
      fallbackLocale: fallbackLocale!,
      global: globalConfig,
      locale: locale!,
      overrideAccess: overrideAccess!,
      populate,
      req,
      select: typeof select?.version === 'object' ? select.version : undefined,
      showHiddenFields: showHiddenFields!,
    })

    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.afterRead?.length) {
      for (const hook of globalConfig.hooks.afterRead) {
        result.version =
          (await hook({
            context: req.context,
            doc: result.version,
            global: globalConfig,
            overrideAccess,
            query: findGlobalVersionsArgs.where,
            req,
          })) || result.version
      }
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type FindGlobalVersionByIDLocalMethod = <TSlug extends GlobalSlug>(
  options: LocalAPIOptions<FindGlobalVersionByIDOptions<TSlug>>,
) => Promise<TypeWithVersion<DataFromGlobalSlug<TSlug>>>

const findGlobalVersionByIDSchema = z.looseObject({
  ...globalInput,
  id: z.string().describe('The global version ID'),
  showHiddenFields: z.boolean().optional(),
})

export const findGlobalVersionByIDLocalAPI = defineLocalAPI<FindGlobalVersionByIDLocalMethod>()({
  name: 'findGlobalVersionByID',
})

export const findVersionByID = defineOperation({
  action: 'findVersionByID',
  expose: {
    local: findGlobalVersionByIDLocalAPI,
    mcp: { name: 'findGlobalVersionByID' },
    rest: [
      {
        method: 'get',
        path: '/versions/:id',
      },
    ],
  },
  handler: findGlobalVersionByIDHandler,
  input: findGlobalVersionByIDSchema,
  target: 'global',
})

export type FindGlobalVersionByIDOptions<TSlug extends GlobalSlug> = {
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
   * the Global slug to operate against.
   */
  slug: TSlug
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<string, SelectType>, 'select'>

async function findGlobalVersionByIDHandler<TSlug extends GlobalSlug>(
  payload: Payload,
  options: FindGlobalVersionByIDOptions<TSlug>,
): Promise<TypeWithVersion<DataFromGlobalSlug<TSlug>>> {
  const {
    id,
    slug: globalSlug,
    depth,
    disableErrors = false,
    overrideAccess = true,
    populate,
    select,
    showHiddenFields,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return findGlobalVersionByID({
    id,
    depth,
    disableErrors,
    globalConfig,
    overrideAccess,
    populate,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    select,
    showHiddenFields,
  })
}
