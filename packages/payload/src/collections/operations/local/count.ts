import type { CollectionSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest, Where } from '../../../types/index.js'
import type { CreateLocalReqOptions } from '../../../utilities/createLocalReq.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { countOperation } from '../count.js'

export type Options<TSlug extends CollectionSlug> = {
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
  user?: Document
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
}

export async function countLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<{ totalDocs: number }> {
  const {
    collection: collectionSlug,
    disableErrors,
    overrideAccess = true,
    trash = false,
    where,
  } = options

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
