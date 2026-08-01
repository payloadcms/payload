import { z } from 'zod'

import type { AccessResult } from '../../config/types.js'
import type {
  GlobalSlug,
  Payload,
  RequestContext,
  SanitizedGlobalConfig,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { APIError } from '../../errors/index.js'
import { buildVersionGlobalFields } from '../../index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { globalSchema, localeSchema, operationWhereSchema } from '../../operations/schemaFields.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { killTransaction } from '../../utilities/killTransaction.js'

type CountGlobalVersionsArgs = {
  disableErrors?: boolean
  global: SanitizedGlobalConfig
  overrideAccess?: boolean
  req?: PayloadRequest
  where?: Where
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const countVersionsForGlobal = async <TSlug extends GlobalSlug>(
  args: CountGlobalVersionsArgs,
): Promise<{ totalDocs: number }> => {
  try {
    const { disableErrors, global, overrideAccess, where } = args
    const req = args.req!
    const { payload } = req

    // /////////////////////////////////////
    // beforeOperation - Global
    // /////////////////////////////////////

    if (global.hooks?.beforeOperation?.length) {
      for (const hook of global.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            context: req.context,
            global,
            operation: 'countVersions',
            overrideAccess,
            req,
          })) || args
      }
    }

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ disableErrors, req }, global.access.readVersions)

      // If errors are disabled, and access returns false, return empty results
      if (accessResult === false) {
        return {
          totalDocs: 0,
        }
      }
    }

    const fullWhere = combineQueries(where!, accessResult!)

    const versionFields = buildVersionGlobalFields(payload.config, global, true)

    await validateQueryPaths({
      globalConfig: global,
      overrideAccess: overrideAccess!,
      req,
      versionFields,
      where: where!,
    })

    const result = await payload.db.countGlobalVersions({
      global: global.slug,
      locale: req?.locale || undefined,
      req,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result
  } catch (error: unknown) {
    await killTransaction(args.req!)
    throw error
  }
}

type CountGlobalVersionsLocalMethod = <TSlug extends GlobalSlug>(
  options: LocalAPIOptions<CountGlobalVersionsOptions<TSlug>>,
) => Promise<{ totalDocs: number }>

const countGlobalVersionsSchema = z.looseObject({
  global: globalSchema,
  locale: localeSchema,
  where: operationWhereSchema.optional(),
})

export const countGlobalVersionsLocalAPI = defineLocalAPI<CountGlobalVersionsLocalMethod>()({
  name: 'countGlobalVersions',
})

export const countVersions = defineOperation({
  action: 'countVersions',
  expose: {
    local: countGlobalVersionsLocalAPI,
    mcp: { name: 'countGlobalVersions' },
  },
  handler: async <TSlug extends GlobalSlug>(
    payload: Payload,
    options: CountGlobalVersionsOptions<TSlug>,
  ): Promise<{ totalDocs: number }> => {
    const { disableErrors, global: globalSlug, overrideAccess = true, where } = options

    const global = payload.globals.config.find(({ slug }) => slug === globalSlug)

    if (!global) {
      throw new APIError(
        `The global with slug ${String(globalSlug)} can't be found. Count Global Versions Operation.`,
      )
    }

    return countVersionsForGlobal<TSlug>({
      disableErrors,
      global,
      overrideAccess,
      req: await createLocalReq(options as CreateLocalReqOptions, payload),
      where,
    })
  },
  input: countGlobalVersionsSchema,
  target: 'global',
})

export type CountGlobalVersionsOptions<TSlug extends GlobalSlug> = {
  /**
   * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
   * which can be read by hooks. Useful if you want to pass additional information to the hooks which
   * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
   * to determine if it should run or not.
   */
  context?: RequestContext
  /**
   * When set to `true`, errors will not be thrown.
   */
  disableErrors?: boolean
  /**
   * the Global slug to operate against.
   */
  global: TSlug
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
   * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
   * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
   */
  req?: Partial<PayloadRequest>
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
}
