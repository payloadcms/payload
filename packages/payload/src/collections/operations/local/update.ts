import type { Config as GeneratedTypes } from 'payload/generated-types';
import type { DeepPartial } from 'ts-essentials';

import type { PayloadRequest, RequestContext } from '../../../express/types.js';
import type { Payload } from '../../../payload.js';
import type { Document, Where } from '../../../types/index.js';
import type { File } from '../../../uploads/types.js';
import type { BulkOperationResult } from '../../config/types.js';

import { APIError } from '../../../errors/index.js';
import { setRequestContext } from '../../../express/setRequestContext.js';
import { i18nInit } from '../../../translations/init.js';
import getFileByPath from '../../../uploads/getFileByPath.js';
import { getDataLoader } from '../../dataloader.js';
import update from '../update.js';
import updateByID from '../updateByID.js';

export type BaseOptions<TSlug extends keyof GeneratedTypes['collections']> = {
  autosave?: boolean;
  collection: TSlug;
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext;
  data: DeepPartial<GeneratedTypes['collections'][TSlug]>;
  depth?: number;
  draft?: boolean;
  fallbackLocale?: string;
  file?: File;
  filePath?: string;
  locale?: string;
  overrideAccess?: boolean;
  overwriteExistingFiles?: boolean;
  req?: PayloadRequest;
  showHiddenFields?: boolean;
  user?: Document;
};

export type ByIDOptions<TSlug extends keyof GeneratedTypes['collections']> = BaseOptions<TSlug> & {
  id: number | string;
  where?: never;
};

export type ManyOptions<TSlug extends keyof GeneratedTypes['collections']> = BaseOptions<TSlug> & {
  id?: never;
  where: Where;
};

export type Options<TSlug extends keyof GeneratedTypes['collections']> =
  | ByIDOptions<TSlug>
  | ManyOptions<TSlug>;

async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: ByIDOptions<TSlug>,
): Promise<GeneratedTypes['collections'][TSlug]>;
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: ManyOptions<TSlug>,
): Promise<BulkOperationResult<TSlug>>;
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]>;
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]> {
  const {
    autosave,
    collection: collectionSlug,
    context,
    data,
    depth,
    draft,
    fallbackLocale = null,
    file,
    filePath,
    id,
    locale = null,
    overrideAccess = true,
    overwriteExistingFiles = false,
    showHiddenFields,
    user,
    where,
  } = options;

  const collection = payload.collections[collectionSlug];

  const i18n = i18nInit(payload.config.i18n);
  const defaultLocale = payload.config.localization
    ? payload.config.localization?.defaultLocale
    : null;

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Update Operation.`,
    );
  }

  const req = {
    fallbackLocale: fallbackLocale ?? defaultLocale,
    files: {
      file: file ?? (await getFileByPath(filePath)),
    },
    i18n,
    locale: locale ?? defaultLocale,
    payload,
    payloadAPI: 'local',
    user,
  } as PayloadRequest;
  setRequestContext(req, context);

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  const args = {
    autosave,
    collection,
    data,
    depth,
    draft,
    id,
    overrideAccess,
    overwriteExistingFiles,
    payload,
    req,
    showHiddenFields,
    where,
  };

  if (options.id) {
    return updateByID<TSlug>(args);
  }
  return update<TSlug>(args);
}

export default updateLocal;
