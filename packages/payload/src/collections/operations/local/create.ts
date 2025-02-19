// @ts-strict-ignore
import type {
  Document,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../../types/index.js'
import type { File } from '../../../uploads/types.js'
import type {
  DataFromCollectionSlug,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import {
  type CollectionSlug,
  deepCopyObjectSimple,
  type Payload,
  type RequestContext,
  type TypedLocale,
} from '../../../index.js'
import { getFileByPath } from '../../../uploads/getFileByPath.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { createOperation } from '../create.js'

export type Options<TSlug extends CollectionSlug, TSelect extends SelectType> = {
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
   * The data for the document to create.
   */
  data: RequiredDataFromCollectionSlug<TSlug>
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
   * If creating verification-enabled auth doc,
   * you can disable the email that is auto-sent
   */
  disableVerificationEmail?: boolean
  /**
   * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
   */
  draft?: boolean
  /**
   * If you want to create a document that is a duplicate of another document
   */
  duplicateFromID?: DataFromCollectionSlug<TSlug>['id']
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * A `File` object when creating a collection with `upload: true`.
   */
  file?: File
  /**
   * A file path when creating a collection with `upload: true`.
   */
  filePath?: string
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
   * If you are uploading a file and would like to replace
   * the existing file instead of generating a new filename,
   * you can set the following property to `true`
   */
  overwriteExistingFiles?: boolean
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

// eslint-disable-next-line no-restricted-exports
export default async function createLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>> {
  const {
    collection: collectionSlug,
    data,
    depth,
    disableTransaction,
    disableVerificationEmail,
    draft,
    duplicateFromID,
    file,
    filePath,
    overrideAccess = true,
    overwriteExistingFiles = false,
    populate,
    select,
    showHiddenFields,
  } = options
  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Create Operation.`,
    )
  }

  const req = await createLocalReq(options, payload)
  req.file = file ?? (await getFileByPath(filePath))

  return createOperation<TSlug, TSelect>({
    collection,
    data: deepCopyObjectSimple(data), // Ensure mutation of data in create operation hooks doesn't affect the original data
    depth,
    disableTransaction,
    disableVerificationEmail,
    draft,
    duplicateFromID,
    overrideAccess,
    overwriteExistingFiles,
    populate,
    req,
    select,
    showHiddenFields,
  })
}
