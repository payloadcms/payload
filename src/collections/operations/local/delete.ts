import { Config as GeneratedTypes } from '../../../generated-types';
import { Document, Where } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../../payload';
import deleteOperation from '../delete';
import deleteByID from '../deleteByID';
import { getDataLoader } from '../../dataloader';
import i18n from '../../../translations/init';
import { APIError } from '../../../errors';
import { BulkOperationResult } from '../../config/types';

export type BaseOptions<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  id: string | number
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

export type ByIDOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
  where?: never
}

export type ManyOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
  where: Where
  id?: never
}

export type Options<TSlug extends keyof GeneratedTypes['collections']> = ByIDOptions<TSlug> | ManyOptions<TSlug>

async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ByIDOptions<TSlug>): Promise<GeneratedTypes['collections'][TSlug]>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ManyOptions<TSlug>): Promise<BulkOperationResult<TSlug>>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<TSlug>): Promise<GeneratedTypes['collections'][TSlug] | BulkOperationResult<TSlug>>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<TSlug>): Promise<GeneratedTypes['collections'][TSlug] | BulkOperationResult<TSlug>> {
  const {
    collection: collectionSlug,
    depth,
    id,
    where,
    locale = null,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const collection = payload.collections[collectionSlug];
  const defaultLocale = payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null;


  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
  }

  const req = {
    user,
    payloadAPI: 'local',
    locale: locale ?? defaultLocale,
    fallbackLocale: fallbackLocale ?? defaultLocale,
    payload,
    i18n: i18n(payload.config.i18n),
  } as PayloadRequest;

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  const args = {
    depth,
    id,
    where,
    collection,
    overrideAccess,
    showHiddenFields,
    req,
  };

  if (options.id) {
    return deleteByID<TSlug>(args);
  }
  return deleteOperation<TSlug>(args);
}

export default deleteLocal;
