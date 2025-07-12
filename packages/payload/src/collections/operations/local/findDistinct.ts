import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Document,
  PaginatedDistinctDocs,
  Payload,
  PayloadRequest,
  PopulateType,
  RequestContext,
  TypedLocale,
  Where,
} from '../../../index.js'
import type { CreateLocalReqOptions } from '../../../utilities/createLocalReq.js'

import { APIError, createLocalReq } from '../../../index.js'
import { findDistinctOperation } from '../findDistinct.js'

export type Options<
  TSlug extends CollectionSlug,
  TField extends keyof DataFromCollectionSlug<TSlug>,
> = {
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
   */
  disableErrors?: boolean
  /**
   * The field to get distinct values for
   */
  field: TField
  /**
   * The maximum distinct field values to be returned.
   * By default the operation returns all the values.
   */
  limit?: number
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: 'all' | TypedLocale
  /**
   * Skip access control.
   * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the fron-end.
   * @default true
   */
  overrideAccess?: boolean
  /**
   * Get a specific page number (if limit is specified)
   * @default 1
   */
  page?: number
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
   * Sorting order
   * @default 'desc'
   */
  sortOrder?: 'asc' | 'desc'
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: Document
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
}

export async function findDistinct<
  TSlug extends CollectionSlug,
  TField extends keyof DataFromCollectionSlug<TSlug> & string,
>(
  payload: Payload,
  options: Options<TSlug, TField>,
): Promise<PaginatedDistinctDocs<Record<TField, DataFromCollectionSlug<TSlug>[TField]>>> {
  const {
    collection: collectionSlug,
    depth = 0,
    disableErrors,
    field,
    limit,
    overrideAccess = true,
    page,
    sortOrder,
    where,
  } = options
  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`,
    )
  }

  return findDistinctOperation({
    collection,
    depth,
    disableErrors,
    field,
    limit,
    overrideAccess,
    page,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    sortOrder,
    where,
  }) as Promise<PaginatedDistinctDocs<Record<TField, DataFromCollectionSlug<TSlug>[TField]>>>
}
