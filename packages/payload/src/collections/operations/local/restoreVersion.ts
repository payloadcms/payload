import type {
  CollectionSlug,
  FindOptions,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../../index.js'
import type { PayloadRequest, PopulateType, SelectType } from '../../../types/index.js'
import type { SharedLocalAPIOptions } from '../../../types/operations.js'
import type { CreatePayloadReqArgs } from '../../../utilities/createPayloadReq.js'
import type { DataFromCollectionSlug, DraftFlagFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createPayloadReq } from '../../../utilities/createPayloadReq.js'
import { restoreVersionOperation } from '../restoreVersion.js'

type BaseOptions<TSlug extends CollectionSlug> = {
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
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * The ID of the version to restore.
   */
  id: string
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: TypedLocale
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
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<TSlug, SelectType>, 'select'> &
  Pick<SharedLocalAPIOptions, 'overrideAccess'>

export type Options<TSlug extends CollectionSlug> = BaseOptions<TSlug> &
  DraftFlagFromCollectionSlug<TSlug>

export async function restoreVersionLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<DataFromCollectionSlug<TSlug>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    overrideAccess = false,
    populate,
    select,
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Restore Version Operation.`,
    )
  }

  const args = {
    id,
    collection,
    depth,
    overrideAccess,
    payload,
    populate,
    req: await createPayloadReq({ ...(options as Omit<CreatePayloadReqArgs, 'payload'>), payload }),
    select,
    showHiddenFields,
  }

  return restoreVersionOperation(args)
}
