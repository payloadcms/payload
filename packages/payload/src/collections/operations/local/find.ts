import type { PaginatedDocs } from '../../../database/types.js'
import type {
  CollectionSlug,
  GeneratedTypes,
  JoinQuery,
  Payload,
  PayloadTypes,
  RequestContext,
  TypedFallbackLocale,
  TypedLocale,
} from '../../../index.js'
import type {
  Document,
  DraftTransformCollectionWithSelect,
  PayloadRequest,
  PopulateType,
  SelectType,
  Sort,
  TransformCollectionWithSelect,
  Where,
} from '../../../types/index.js'
import type { CreateLocalReqOptions } from '../../../utilities/createLocalReq.js'
import type {
  DraftFlagFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findOperation } from '../find.js'

type BaseFindOptions<TSlug extends CollectionSlug, TSelect extends SelectType> = {
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
   * The current population depth, used internally for relationships population.
   * @internal
   */
  currentDepth?: number
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * When set to `true`, errors will not be thrown.
   */
  disableErrors?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: TypedFallbackLocale
  /**
   * Include info about the lock status to the result into all documents with fields: `_isLocked` and `_userEditing`
   */
  includeLockStatus?: boolean
  /**
   * The [Join Field Query](https://payloadcms.com/docs/fields/join#query-options).
   * Pass `false` to disable all join fields from the result.
   */
  joins?: JoinQuery<TSlug>
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
   * By default, Payload's APIs will return all fields for a given collection or global.
   * But you may not need all of that data for all of your queries.
   * Sometimes, you might want just a few fields from the response.
   *
   * With the Select API, you can define exactly which fields you'd like to retrieve.
   * This can impact performance by reducing database load and response size.
   *
   *
   * **Example: Select specific fields**
   * ```ts
   * const post = await payload.findByID({
   *   collection: 'posts',
   *   id: '1',
   *   select: { title: true, content: true },
   * })
   *
   * console.log(post) // { id: '1', title: 'My Post', content: 'This is my post' }
   * ```
   *
   * **Example: Select all fields except `content`**
   *
   * ```ts
   * const post = await payload.findByID({
   *   collection: 'posts',
   *   id: '1',
   *   select: { content: false },
   * })
   *
   * console.log(post) // { id: '1', title: 'My Post', number: 3 }
   * ```
   *
   * **Example: Empty select returns only `id`**
   *
   * ```ts
   * const post = await payload.findByID({
   *   collection: 'posts',
   *   id: '1',
   *   select: {},
   * })
   *
   * console.log(post) // { id: '1' }
   * ```
   *
   * @see https://payloadcms.com/docs/queries/select
   */
  select?: TSelect
  /**
   * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
   * @default false
   */
  showHiddenFields?: boolean
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-createdAt' // Sort DESC by createdAt
   * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  /**
   * When set to `true`, the query will include both normal and trashed documents.
   * To query only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
   * By default (`false`), the query will only include normal documents and exclude those with a `deletedAt` field.
   *
   * This argument has no effect unless `trash` is enabled on the collection.
   * @default false
   */
  trash?: boolean
  // TODO: Strongly type User as TypedUser (= User in v4.0)
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: Document
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
}

export type Options<TSlug extends CollectionSlug, TSelect extends SelectType> =
  BaseFindOptions<TSlug, TSelect> & DraftFlagFromCollectionSlug<TSlug>

// Backward compatibility export
export type FindOptions<TSlug extends CollectionSlug, TSelect extends SelectType> =
  Options<TSlug, TSelect>

export async function findLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDraft extends boolean = false,
>(
  payload: Payload,
  options: { draft?: TDraft } & FindOptions<TSlug, TSelect>,
): Promise<
  PaginatedDocs<
    TDraft extends true
      ? PayloadTypes extends { strictDraftTypes: true }
        ? DraftTransformCollectionWithSelect<TSlug, TSelect>
        : TransformCollectionWithSelect<TSlug, TSelect>
      : TransformCollectionWithSelect<TSlug, TSelect>
  >
> {
  const {
    collection: collectionSlug,
    currentDepth,
    depth,
    disableErrors,
    draft = false,
    includeLockStatus,
    joins,
    limit,
    overrideAccess = true,
    page,
    pagination = true,
    populate,
    select,
    showHiddenFields,
    sort,
    trash = false,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`,
    )
  }

  return findOperation<TSlug, TSelect>({
    collection,
    currentDepth,
    depth,
    disableErrors,
    draft,
    includeLockStatus,
    joins,
    limit,
    overrideAccess,
    page,
    pagination,
    populate,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    select,
    showHiddenFields,
    sort,
    trash,
    where,
  })
}
