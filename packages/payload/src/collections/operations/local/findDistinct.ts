import type { CreateLocalReqOptions } from '../../../utilities/createLocalReq.js'

import {
  APIError,
  type CollectionSlug,
  createLocalReq,
  type PaginatedDistinctDocs,
  type Payload,
  type PayloadRequest,
  type TypedLocale,
  type Where,
} from '../../../index.js'
import { findDistinctOperation } from '../findDistinct.js'

export type Options = {
  /**
   * the Collection slug to operate against.
   */
  collection: CollectionSlug
  /**
   * When set to `true`, errors will not be thrown.
   */
  disableErrors?: boolean
  /**
   * The field to get distinct values for
   */
  field: string
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
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
}

export async function findDistinct(
  payload: Payload,
  options: Options,
): Promise<PaginatedDistinctDocs> {
  const {
    collection: collectionSlug,
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
    disableErrors,
    field,
    limit,
    overrideAccess,
    page,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    sortOrder,
    where,
  })
}
