import type { UploadedFile } from 'express-fileupload'
import type { MarkOptional } from 'ts-essentials'

import type { PayloadT } from '../../..'
import type { GeneratedTypes } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../types'
import type { Document } from '../../../types'
import type { File } from '../../../uploads/types'

import { APIError } from '../../../errors'
import getFileByPath from '../../../uploads/getFileByPath'
<<<<<<< HEAD
import { createLocalReq } from '../../../utilities/createLocalReq'
import create from '../create'
=======
import { setRequestContext } from '../../../utilities/setRequestContext'
import { getDataLoader } from '../../dataloader'
import { createOperation } from '../create'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

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
  payload: PayloadT,
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
  const fileToSet = (file ?? (await getFileByPath(filePath))) as UploadedFile
  if (fileToSet) {
    if (req?.files) {
      req.files.file = fileToSet
    } else {
      req.files = {
        file: fileToSet,
      }
    }
  }

<<<<<<< HEAD
  return create<TSlug>({
=======
  if (typeof user !== 'undefined') req.user = user

  if (!req.t) req.t = req.i18n.t
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return createOperation<TSlug>({
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))
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
