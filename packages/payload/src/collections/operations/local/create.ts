import type { UploadedFile } from 'express-fileupload';
import type { Config as GeneratedTypes } from 'payload/generated-types';
import type { MarkOptional } from 'ts-essentials';

import type { PayloadRequest, RequestContext } from '../../../express/types';
import type { Payload } from '../../../payload';
import type { Document } from '../../../types';
import type { File } from '../../../uploads/types';

import { APIError } from '../../../errors';
import { setRequestContext } from '../../../express/setRequestContext';
import { i18nInit } from '../../../translations/init';
import getFileByPath from '../../../uploads/getFileByPath';
import { getDataLoader } from '../../dataloader';
import create from '../create';

export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  data: MarkOptional<GeneratedTypes['collections'][TSlug], 'createdAt' | 'id' | 'sizes' | 'updatedAt'>
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
    context,
    data,
    depth,
    disableVerificationEmail,
    draft,
    fallbackLocale = null,
    file,
    filePath,
    locale = null,
    overrideAccess = true,
    overwriteExistingFiles = false,
    req = {} as PayloadRequest,
    showHiddenFields,
    user,
  } = options;
  setRequestContext(req, context);

  const collection = payload.collections[collectionSlug];
  const defaultLocale = payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null;

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Create Operation.`);
  }

  req.payloadAPI = req.payloadAPI || 'local';
  req.locale = locale ?? req?.locale ?? defaultLocale;
  req.fallbackLocale = fallbackLocale ?? req?.fallbackLocale ?? defaultLocale;
  req.payload = payload;
  req.i18n = i18nInit(payload.config.i18n);
  req.files = {
    file: (file ?? (await getFileByPath(filePath))) as UploadedFile,
  };

  if (typeof user !== 'undefined') req.user = user;

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return create<TSlug>({
    collection,
    data,
    depth,
    disableVerificationEmail,
    draft,
    overrideAccess,
    overwriteExistingFiles,
    req,
    showHiddenFields,
  });
}
