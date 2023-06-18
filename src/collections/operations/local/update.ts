import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Payload } from '../../../payload';
import { Document, Where } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';
import update from '../update';
import { PayloadRequest } from '../../../express/types';
import { getDataLoader } from '../../dataloader';
import { File } from '../../../uploads/types';
import i18nInit from '../../../translations/init';
import { APIError } from '../../../errors';
import updateByID from '../updateByID';
import { BulkOperationResult } from '../../config/types';

export type BaseOptions<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  data: DeepPartial<GeneratedTypes['collections'][TSlug]>
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

export type ByIDOptions<TSlug extends keyof GeneratedTypes['collections']> = BaseOptions<TSlug> & {
  id: string | number
  where?: never
}

export type ManyOptions<TSlug extends keyof GeneratedTypes['collections']> = BaseOptions<TSlug> & {
  where: Where
  id?: never
}

export type Options<TSlug extends keyof GeneratedTypes['collections']> = ByIDOptions<TSlug> | ManyOptions<TSlug>

async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ByIDOptions<TSlug>): Promise<GeneratedTypes['collections'][TSlug]>
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ManyOptions<TSlug>): Promise<BulkOperationResult<TSlug>>
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<TSlug>): Promise<GeneratedTypes['collections'][TSlug] | BulkOperationResult<TSlug>>
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<TSlug>): Promise<GeneratedTypes['collections'][TSlug] | BulkOperationResult<TSlug>> {
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
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
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
    return updateByID<TSlug>(args);
  }
  return update<TSlug>(args);
}

export default updateLocal;
