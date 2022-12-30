import { Payload } from '../../..';
import { Document, Where } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';
import update from '../update';
import { PayloadRequest } from '../../../express/types';
import { getDataLoader } from '../../dataloader';
import { File } from '../../../uploads/types';
import i18nInit from '../../../translations/init';
import { APIError } from '../../../errors';
import updateByID from '../updateByID';

type BaseOptions<T> = {
  collection: string
  data: Partial<T>
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

export type ByIDOptions<T> = BaseOptions<T> & {
  id: string | number
  where?: never
}

export type ManyOptions<T> = BaseOptions<T> & {
  where: Where
  id?: never
}

export type Options<T> = ByIDOptions<T> | ManyOptions<T>

async function updateLocal<T = any>(payload: Payload, options: ByIDOptions<T>): Promise<T>
async function updateLocal<T = any>(payload: Payload, options: ManyOptions<T>): Promise<T[]>
async function updateLocal<T = any>(payload: Payload, options: Options<T>): Promise<T | T[]>
async function updateLocal<T = any>(payload: Payload, options: Options<T>): Promise<T | T[]> {
  const {
    collection: collectionSlug,
    depth,
    locale = null,
    fallbackLocale = null,
    data,
    user,
    overrideAccess = true,
    showHiddenFields,
    filePath,
    file,
    overwriteExistingFiles = false,
    draft,
    autosave,
    id,
    where,
  } = options;

  const collection = payload.collections[collectionSlug];

  if (!collection) {
    throw new APIError(`The collection with slug ${collectionSlug} can't be found.`);
  }

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
    showHiddenFields,
    overwriteExistingFiles,
    draft,
    autosave,
    payload,
    req,
    id,
    where,
  };

  if (options.id) {
    return updateByID(args);
  }
  return update(args);
}

export default updateLocal;
