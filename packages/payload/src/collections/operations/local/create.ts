import type { MarkOptional } from 'ts-essentials'

import type { GeneratedTypes } from '../../../index.js'
import type { Payload } from '../../../index.js'
import type { Document, PayloadRequest, RequestContext } from '../../../types/index.js'
import type { File } from '../../../uploads/types.js'

import { APIError } from '../../../errors/index.js'
import { getFileByPath } from '../../../uploads/getFileByPath.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { createOperation } from '../create.js'

export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  data: MarkOptional<
    GeneratedTypes['collections'][TSlug],
    'createdAt' | 'id' | 'sizes' | 'updatedAt'
  >
  depth?: number
  disableVerificationEmail?: boolean
  draft?: boolean
  fallbackLocale?: string
  file?: File
  filePath?: string
  locale?: string
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export default async function createLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<GeneratedTypes['collections'][TSlug]> {
  const {
    collection: collectionSlug,
    data,
    depth,
    disableVerificationEmail,
    draft,
    file,
    filePath,
    overrideAccess = true,
    overwriteExistingFiles = false,
    showHiddenFields,
  } = options
  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Create Operation.`,
    )
  }

  const req = createLocalReq(options, payload)
  req.file = file ?? (await getFileByPath(filePath))

  return createOperation<TSlug>({
    collection,
    data,
    depth,
    disableVerificationEmail,
    draft,
    overrideAccess,
    overwriteExistingFiles,
    req,
    showHiddenFields,
  })
}
