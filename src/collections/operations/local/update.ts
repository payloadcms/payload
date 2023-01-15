import { Config as SchemaConfig } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { Document } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';
import update from '../update';
import { PayloadRequest } from '../../../express/types';
import { getDataLoader } from '../../dataloader';
import { File } from '../../../uploads/types';
import i18nInit from '../../../translations/init';

export type Options<TSlug extends keyof SchemaConfig['collections']> = {
  collection: TSlug
  id: string | number
  data: SchemaConfig['collections'][TSlug]
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  filePath?: string
  file?: File
  overwriteExistingFiles?: boolean
  draft?: boolean
  autosave?: boolean
}

export default async function updateLocal<TSlug extends keyof SchemaConfig['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<SchemaConfig['collections'][TSlug]> {
  const {
    collection: collectionSlug,
    depth,
    locale = null,
    fallbackLocale = null,
    data,
    id,
    user,
    overrideAccess = true,
    showHiddenFields,
    filePath,
    file,
    overwriteExistingFiles = false,
    draft,
    autosave,
  } = options;

  const collection = payload.collections[collectionSlug];
  const i18n = i18nInit(payload.config.i18n);
  const defaultLocale = payload.config.localization ? payload.config.localization?.defaultLocale : null;

  const req = {
    user,
    payloadAPI: 'local',
    locale: locale ?? defaultLocale,
    fallbackLocale: fallbackLocale ?? defaultLocale,
    payload,
    i18n,
    files: {
      file: file ?? await getFileByPath(filePath),
    },
  } as PayloadRequest;

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  const args = {
    depth,
    data,
    collection,
    overrideAccess,
    id,
    showHiddenFields,
    overwriteExistingFiles,
    draft,
    autosave,
    payload,
    req,
  };

  return update<TSlug>(args);
}
