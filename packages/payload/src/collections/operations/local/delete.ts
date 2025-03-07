// @ts-strict-ignore
import type { CollectionSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type {
  Document,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
  Where,
} from '../../../types/index.js'
import type { BulkOperationResult, SelectFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { deleteOperation } from '../delete.js'
import { deleteByIDOperation } from '../deleteByID.js'

export type BaseOptions<TSlug extends CollectionSlug, TSelect extends SelectType> = {
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
   * When set to `true`, a [database transactions](https://payloadcms.com/docs/database/transactions) will not be initialized.
   * @default false
   */
  disableTransaction?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: TypedLocale
  /**
   * Skip access control.
   * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the fron-end.
   * @default true
   */
  overrideAccess?: boolean
  /**
   * By default, document locks are ignored (`true`). Set to `false` to enforce locks and prevent operations when a document is locked by another user. [More details](https://payloadcms.com/docs/admin/locked-documents).
   * @default true
   */
  overrideLock?: boolean
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
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: TSelect
  /**
   * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
   * @default false
   */
  showHiddenFields?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: Document
}

export type ByIDOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = {
  /**
   * The ID of the document to delete.
   */
  id: number | string
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: never
} & BaseOptions<TSlug, TSelect>

export type ManyOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = {
  /**
   * The ID of the document to delete.
   */
  id?: never
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where: Where
} & BaseOptions<TSlug, TSelect>

export type Options<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = ByIDOptions<TSlug, TSelect> | ManyOptions<TSlug, TSelect>

async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: ByIDOptions<TSlug, TSelect>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>>
async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: ManyOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect>>
async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>>
async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    disableTransaction,
    overrideAccess = true,
    overrideLock,
    populate,
    select,
    showHiddenFields,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Delete Operation.`,
    )
  }

  const args = {
    id,
    collection,
    depth,
    disableTransaction,
    overrideAccess,
    overrideLock,
    populate,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
    where,
  }

  if (options.id) {
    return deleteByIDOperation<TSlug, TSelect>(args)
  }
  return deleteOperation<TSlug, TSelect>(args)
}

export default deleteLocal
