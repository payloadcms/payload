import type {
  AllowedDepth,
  CollectionSlug,
  DefaultDepth,
  Payload,
  RequestContext,
  TypedLocale,
} from '../../../index.js'
import type {
  ApplyDepthInternal,
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
import { getFileByPath } from '../../../uploads/getFileByPath.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { createOperation } from '../create.js'

export type Options<
  TSlug extends CollectionSlug,
  TSelect extends SelectType,
  TDepth extends AllowedDepth = DefaultDepth,
> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  data: RequiredDataFromCollectionSlug<TSlug>
  depth?: TDepth
  disableTransaction?: boolean
  disableVerificationEmail?: boolean
  draft?: boolean
  duplicateFromID?: DataFromCollectionSlug<TSlug>['id']
  fallbackLocale?: false | TypedLocale
  file?: File
  filePath?: string
  locale?: TypedLocale
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  user?: Document
}

// eslint-disable-next-line no-restricted-exports
export default async function createLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TSelect, TDepth>,
): Promise<ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>> {
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
    data,
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
