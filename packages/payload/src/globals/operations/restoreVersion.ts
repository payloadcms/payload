import { z } from 'zod'

import type {
  DataFromGlobalSlug,
  GlobalSlug,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, PopulateType } from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { APIError, NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { globalInput } from '../../operations/schemaFields.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'

type RestoreGlobalVersionArgs = {
  depth?: number
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  id: number | string
  overrideAccess?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  showHiddenFields?: boolean
}

const restoreGlobalVersion = async <T extends TypeWithVersion<T> = any>(
  args: RestoreGlobalVersionArgs,
): Promise<T> => {
  const { id, depth, draft, globalConfig, overrideAccess, populate, showHiddenFields } = args
  const req = args.req!
  const { fallbackLocale, locale, payload } = req

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // beforeOperation - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.beforeOperation?.length) {
      for (const hook of globalConfig.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            context: req.context,
            global: globalConfig,
            operation: 'restoreVersion',
            overrideAccess,
            req,
          })) || args
      }
    }

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      await executeAccess({ req }, globalConfig.access.update)
    }

    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////

    const { docs: versionDocs } = await payload.db.findGlobalVersions<any>({
      global: globalConfig.slug,
      limit: 1,
      req,
      where: { id: { equals: id } },
    })

    if (!versionDocs || versionDocs.length === 0) {
      throw new NotFound(req.t)
    }

    const rawVersion = versionDocs[0]!

    // Patch globalType onto version doc
    rawVersion.version.globalType = globalConfig.slug

    // Overwrite draft status if draft is true

    if (draft) {
      rawVersion.version._status = 'draft'
    }
    // /////////////////////////////////////
    // fetch previousDoc
    // /////////////////////////////////////

    const previousDoc = await payload.findGlobal({
      slug: globalConfig.slug,
      depth,
      req,
    })

    req.context.isRestoringVersion = true

    // /////////////////////////////////////
    // Update global
    // /////////////////////////////////////

    const global = await payload.db.findGlobal({
      slug: globalConfig.slug,
      req,
    })

    let result = rawVersion.version

    if (global) {
      // Ensure updatedAt date is always updated
      result.updatedAt = new Date().toISOString()
      result = await payload.db.updateGlobal({
        slug: globalConfig.slug,
        data: result,
        req,
      })

      const now = new Date().toISOString()

      result = await payload.db.createGlobalVersion({
        autosave: false,
        createdAt: result.createdAt ? new Date(result.createdAt).toISOString() : now,
        globalSlug: globalConfig.slug,
        req,
        updatedAt: draft ? now : new Date(result.updatedAt).toISOString(),
        versionData: result,
      })
    } else {
      result = await payload.db.createGlobal({
        slug: globalConfig.slug,
        data: result,
        req,
      })
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: null,
      context: req.context,
      depth: depth!,
      doc: result,
      draft: undefined!,
      fallbackLocale: fallbackLocale!,
      global: globalConfig,
      locale: locale!,
      overrideAccess: overrideAccess!,
      populate,
      req,
      showHiddenFields: showHiddenFields!,
    })

    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.afterRead?.length) {
      for (const hook of globalConfig.hooks.afterRead) {
        result =
          (await hook({
            context: req.context,
            doc: result,
            global: globalConfig,
            overrideAccess,
            req,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterChange - Fields
    // /////////////////////////////////////

    result = await afterChange({
      collection: null,
      context: req.context,
      data: result,
      doc: result,
      global: globalConfig,
      operation: 'update',
      previousDoc,
      req,
    })

    // /////////////////////////////////////
    // afterChange - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.afterChange?.length) {
      for (const hook of globalConfig.hooks.afterChange) {
        result =
          (await hook({
            context: req.context,
            data: result,
            doc: result,
            global: globalConfig,
            overrideAccess,
            previousDoc,
            req,
          })) || result
      }
    }

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type RestoreGlobalVersionLocalMethod = <TSlug extends GlobalSlug>(
  options: LocalAPIOptions<RestoreGlobalVersionOptions<TSlug>>,
) => Promise<DataFromGlobalSlug<TSlug>>

const restoreGlobalVersionSchema = z.looseObject({
  ...globalInput,
  id: z.string().describe('The global version ID to restore'),
  draft: z.boolean().describe('Restore the version as a draft').optional().default(false),
  showHiddenFields: z.boolean().optional(),
})

export const restoreGlobalVersionLocalAPI = defineLocalAPI<RestoreGlobalVersionLocalMethod>()({
  name: 'restoreGlobalVersion',
})

export const restoreVersion = defineOperation({
  action: 'restoreVersion',
  expose: {
    local: restoreGlobalVersionLocalAPI,
    mcp: { name: 'restoreGlobalVersion' },
    rest: [
      {
        method: 'post',
        path: '/versions/:id',
      },
    ],
  },
  handler: restoreGlobalVersionHandler,
  input: restoreGlobalVersionSchema,
  target: 'global',
})

export type RestoreGlobalVersionOptions<TSlug extends GlobalSlug> = {
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
   * Restore as a draft version.
   */
  draft?: boolean
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
   * the Global slug to operate against.
   */
  slug: TSlug
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
}

async function restoreGlobalVersionHandler<TSlug extends GlobalSlug>(
  payload: Payload,
  options: RestoreGlobalVersionOptions<TSlug>,
): Promise<DataFromGlobalSlug<TSlug>> {
  const {
    id,
    slug: globalSlug,
    depth,
    draft,
    overrideAccess = true,
    populate,
    showHiddenFields,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return restoreGlobalVersion({
    id,
    depth,
    draft,
    globalConfig,
    overrideAccess,
    populate,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    showHiddenFields,
  })
}
