import { Config as GeneratedTypes } from 'payload/generated-types';
import { UploadedFile } from 'express-fileupload';
import { MarkOptional } from 'ts-essentials';
import { Payload } from '../../../payload';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';
import create from '../create';
import { getDataLoader } from '../../dataloader';
import { File } from '../../../uploads/types';
import i18n from '../../../translations/init';
import { APIError } from '../../../errors';

export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  data: MarkOptional<GeneratedTypes['collections'][TSlug], 'id' | 'updatedAt' | 'createdAt' | 'sizes'>
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  disableVerificationEmail?: boolean
  showHiddenFields?: boolean
  filePath?: string
  file?: File
  overwriteExistingFiles?: boolean
  req?: PayloadRequest
  draft?: boolean
}

export default async function createLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<GeneratedTypes['collections'][TSlug]> {
  const {
    collection: collectionSlug,
    depth,
    locale = null,
    fallbackLocale = null,
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
  const defaultLocale = payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null;

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
  }

  req.payloadAPI = 'local';
  req.locale = locale ?? req?.locale ?? defaultLocale;
  req.fallbackLocale = fallbackLocale ?? req?.fallbackLocale ?? defaultLocale;
  req.payload = payload;
  req.i18n = i18n(payload.config.i18n);
  req.files = {
    file: (file ?? (await getFileByPath(filePath))) as UploadedFile,
  };

  if (typeof user !== 'undefined') req.user = user;

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return create<TSlug>({
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
