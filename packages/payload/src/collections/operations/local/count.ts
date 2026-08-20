import type { CollectionSlug, Payload, RequestContext, TypedLocale, User } from '../../../index.js'
import type { PayloadRequest, Where } from '../../../types/index.js'
import type { CreateLocalReqOptions } from '../../../utilities/createLocalReq.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { warnMissingOverrideAccess } from '../../../utilities/warnMissingOverrideAccess.js'
import { countOperation } from '../count.js'

export type CountOptions<TSlug extends CollectionSlug> = {
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
   * When set to `true`, errors will not be thrown.
   */
  disableErrors?: boolean
  /**
   *  Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
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
   * When set to `true`, the query will include both normal and trashed documents.
   * To query only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
   * By default (`false`), the query will only include normal documents and exclude those with a `deletedAt` field.
   *
   * This argument has no effect unless `trash` is enabled on the collection.
   * @default false
   */
  trash?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
}

export async function countLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: CountOptions<TSlug>,
): Promise<{ totalDocs: number }> {
  const {
    collection: collectionSlug,
    disableErrors,
    overrideAccess: overrideAccessFromOptions,
    trash = false,
    where,
  } = options

  // An untyped caller — plain JavaScript, an `as any` cast, or a plugin whose JavaScript was
  // compiled against Payload 3 — can still omit this. Coerce once, here, so nothing further
  // in has to decide what a missing value means. `false` enforces access control, so the
  // failure mode is a missing document rather than a leaked one.
  if (overrideAccessFromOptions === undefined) {
    warnMissingOverrideAccess({ operation: 'payload.count', payload })
  }

  const overrideAccess = overrideAccessFromOptions ?? false

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Count Operation.`,
    )
  }

  return countOperation<TSlug>({
    collection,
    disableErrors,
    overrideAccess,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    trash,
    where,
  })
}
