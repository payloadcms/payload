import type { GlobalSlug, Payload, RequestContext, TypedLocale, User } from '../../../index.js'
import type { PayloadRequest, Where } from '../../../types/index.js'
import type { CreateLocalReqOptions } from '../../../utilities/createLocalReq.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { warnMissingOverrideAccess } from '../../../utilities/warnMissingOverrideAccess.js'
import { countGlobalVersionsOperation } from '../countGlobalVersions.js'

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
   * Whether to skip access control for this operation.
   *
   * `false` respects Access Control — use this whenever the operation acts on behalf of a
   * user, such as fetching data for the front-end.
   * `true` bypasses it — use this for trusted server-side work such as cron jobs, seeding,
   * and migrations.
   *
   * Required. Omitting it used to skip access control silently.
   */
  overrideAccess: boolean
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

export async function countGlobalVersionsLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: CountGlobalVersionsOptions<TSlug>,
): Promise<{ totalDocs: number }> {
  const {
    disableErrors,
    global: globalSlug,
    overrideAccess: overrideAccessFromOptions,
    where,
  } = options

  // An untyped caller — plain JavaScript, an `as any` cast, or a plugin whose JavaScript was
  // compiled against Payload 3 — can still omit this. Coerce once, here, so nothing further
  // in has to decide what a missing value means. `false` enforces access control, so the
  // failure mode is a missing document rather than a leaked one.
  if (overrideAccessFromOptions === undefined) {
    warnMissingOverrideAccess({ operation: 'payload.countGlobalVersions', payload })
  }

  const overrideAccess = overrideAccessFromOptions ?? false

  const global = payload.globals.config.find(({ slug }) => slug === globalSlug)

  if (!global) {
    throw new APIError(
      `The global with slug ${String(globalSlug)} can't be found. Count Global Versions Operation.`,
    )
  }

  return countGlobalVersionsOperation<TSlug>({
    disableErrors,
    global,
    overrideAccess,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    where,
  })
}
