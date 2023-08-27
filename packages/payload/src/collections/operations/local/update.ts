import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Payload } from '../../../payload.js';
import { Document, Where } from '../../../types/index.js';
import getFileByPath from '../../../uploads/getFileByPath.js';
import update from '../update.js';
import { PayloadRequest, RequestContext } from '../../../express/types.js';
import { getDataLoader } from '../../dataloader.js';
import { File } from '../../../uploads/types.js';
import { i18nInit } from '../../../translations/init.js';
import { APIError } from '../../../errors/index.js';
import updateByID from '../updateByID.js';
import { BulkOperationResult } from '../../config/types.js';
import { setRequestContext } from '../../../express/setRequestContext.js';

export type BaseOptions<TSlug extends keyof GeneratedTypes['collections']> = {
  req?: PayloadRequest,
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
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
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
    context,
  } = options;

  const collection = payload.collections[collectionSlug];
  const i18n = i18nInit(payload.config.i18n);
  const defaultLocale = payload.config.localization ? payload.config.localization?.defaultLocale : null;

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Update Operation.`);
  }

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
  setRequestContext(req, context);

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
