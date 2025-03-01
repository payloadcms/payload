// @ts-strict-ignore
import type { CollectionSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest, PopulateType, SelectType } from '../../../types/index.js'
import type { DataFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { restoreVersionOperation } from '../restoreVersion.js'

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
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Whether the document should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
   */
  draft?: boolean
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
   * Skip access control.
   * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the fron-end.
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
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: SelectType
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

export default async function restoreVersionLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<DataFromCollectionSlug<TSlug>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    overrideAccess = true,
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
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  }

  return restoreVersionOperation(args)
}
