import { UploadedFile } from 'express-fileupload';
import { Payload } from '../../..';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';
import create from '../create';
import { getDataLoader } from '../../dataloader';


export type Options<T> = {
  collection: string
  data: Record<string, unknown>
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  disableVerificationEmail?: boolean
  showHiddenFields?: boolean
  filePath?: string
  file?: UploadedFile
  overwriteExistingFiles?: boolean
  req?: PayloadRequest
  draft?: boolean
}

export default async function createLocal<T = any>(payload: Payload, options: Options<T>): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    locale,
    fallbackLocale,
    data,
    user,
    overrideAccess = true,
    disableVerificationEmail,
    showHiddenFields,
    filePath,
    file,
    overwriteExistingFiles = false,
    req = {} as PayloadRequest,
    draft,
  } = options;

  const collection = payload.collections[collectionSlug];

  req.payloadAPI = 'local';
  req.locale = locale || req?.locale || (payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null);
  req.fallbackLocale = fallbackLocale || req?.fallbackLocale || null;
  req.payload = payload;
  req.files = {
    file: (file as UploadedFile) ?? (getFileByPath(filePath) as UploadedFile),
  };

  if (typeof user !== 'undefined') req.user = user;

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return create({
    depth,
    data,
    collection,
    overrideAccess,
    disableVerificationEmail,
    showHiddenFields,
    overwriteExistingFiles,
    draft,
    req,
  });
}
