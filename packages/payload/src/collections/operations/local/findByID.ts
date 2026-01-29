import type {
  CollectionSlug,
  FindOptions,
  JoinQuery,
  Payload,
  RequestContext,
  SelectType,
  TypedFallbackLocale,
  TypedLocale,
} from '../../../index.js'
import type {
  ApplyDisableErrors,
  Document,
  PayloadRequest,
  PopulateType,
  TransformCollectionWithSelect,
} from '../../../types/index.js'
import type { CreateLocalReqOptions } from '../../../utilities/createLocalReq.js'
import type {
  DraftFlagFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { type FindByIDArgs, findByIDOperation } from '../findByID.js'

type BaseFindByIDOptions<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectType,
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
   * The current population depth, used internally for relationships population.
   * @internal
   */
  currentDepth?: number
  /**
   * You may pass the document data directly which will skip the `db.findOne` database query.
   * This is useful if you want to use this endpoint solely for running hooks and populating data.
   */
  data?: Record<string, unknown>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * When set to `true`, errors will not be thrown.
   * `null` will be returned instead, if the document on this ID was not found.
   */
  disableErrors?: TDisableErrors
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: TypedFallbackLocale
  /**
   * The ID of the document to find.
   */
  id: number | string
  /**
   * Include info about the lock status to the result with fields: `_isLocked` and `_userEditing`
   */
  includeLockStatus?: boolean
  /**
   * The [Join Field Query](https://payloadcms.com/docs/fields/join#query-options).
   * Pass `false` to disable all join fields from the result.
   */
  joins?: JoinQuery<TSlug>
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
   * When set to `true`, the operation will return a document by ID, even if it is trashed (soft-deleted).
   * By default (`false`), the operation will exclude trashed documents.
   * To fetch a trashed document, set `trash: true`.
   *
   * This argument has no effect unless `trash` is enabled on the collection.
   * @default false
   */
  trash?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: Document
} & Pick<FindByIDArgs, 'flattenLocales'> &
  Pick<FindOptions<TSlug, TSelect>, 'select'>

export type Options<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectType,
> = BaseFindByIDOptions<TSlug, TDisableErrors, TSelect> & DraftFlagFromCollectionSlug<TSlug>

export async function findByIDLocal<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TDisableErrors, TSelect>,
): Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>> {
  const {
    id,
    collection: collectionSlug,
    currentDepth,
    data,
    depth,
    disableErrors = false,
    draft = false,
    flattenLocales,
    includeLockStatus,
    joins,
    overrideAccess = true,
    populate,
    select,
    showHiddenFields,
    trash = false,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find By ID Operation.`,
    )
  }

  return findByIDOperation<TSlug, TDisableErrors, TSelect>({
    id,
    collection,
    currentDepth,
    data,
    depth,
    disableErrors,
    draft,
    flattenLocales,
    includeLockStatus,
    joins,
    overrideAccess,
    populate,
    req: await createLocalReq(options as CreateLocalReqOptions, payload),
    select,
    showHiddenFields,
    trash,
  })
}
