import type { PayloadRequest, RequestContext } from '../../../express/types.js';
import type { Config as GeneratedTypes } from '../../../generated-types.js';
import type { Payload } from '../../../payload.js';
import type { Document, Where } from '../../../types/index.js';
import type { BulkOperationResult } from '../../config/types.js';

import { APIError } from '../../../errors/index.js';
import { setRequestContext } from '../../../express/setRequestContext.js';
import { i18nInit } from '../../../translations/init.js';
import { getDataLoader } from '../../dataloader.js';
import deleteOperation from '../delete.js';
import deleteByID from '../deleteByID.js';

export type BaseOptions<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest,
  showHiddenFields?: boolean
  user?: Document
}

export type ByIDOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
  id: number | string
  where?: never
}

export type ManyOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
  id?: never
  where: Where
}

export type Options<TSlug extends keyof GeneratedTypes['collections']> = ByIDOptions<TSlug> | ManyOptions<TSlug>

async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ByIDOptions<TSlug>): Promise<GeneratedTypes['collections'][TSlug]>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ManyOptions<TSlug>): Promise<BulkOperationResult<TSlug>>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<TSlug>): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<TSlug>): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]> {
  const {
    collection: collectionSlug,
    context,
    depth,
    fallbackLocale = null,
    id,
    locale = null,
    overrideAccess = true,
    showHiddenFields,
    user,
    where,
  } = options;

  const collection = payload.collections[collectionSlug];
  const defaultLocale = payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null;

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Delete Operation.`);
  }

  const req = {
    fallbackLocale: fallbackLocale ?? defaultLocale,
    i18n: i18nInit(payload.config.i18n),
    locale: locale ?? defaultLocale,
    payload,
    payloadAPI: 'local',
    user,
  } as PayloadRequest;
  setRequestContext(req, context);

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  const args = {
    collection,
    depth,
    id,
    overrideAccess,
    req,
    showHiddenFields,
    where,
  };

  if (options.id) {
    return deleteByID<TSlug>(args);
  }
  return deleteOperation<TSlug>(args);
}

export default deleteLocal;
