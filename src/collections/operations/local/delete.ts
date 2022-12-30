import { TypeWithID } from '../../config/types';
import { Document, Where } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../../index';
import deleteOperation from '../delete';
import deleteByID from '../deleteByID';
import { getDataLoader } from '../../dataloader';
import i18n from '../../../translations/init';
import { APIError } from '../../../errors';

export type BaseOptions = {
  collection: string

  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

export type ByIDOptions = BaseOptions & {
  id: string
  where?: never
}

export type ManyOptions = BaseOptions & {
  where: Where
  id?: never
}

export type Options = ByIDOptions | ManyOptions

async function deleteLocal<T extends TypeWithID = any>(payload: Payload, options: ByIDOptions): Promise<T>
async function deleteLocal<T extends TypeWithID = any>(payload: Payload, options: ManyOptions): Promise<T[]>
async function deleteLocal<T extends TypeWithID = any>(payload: Payload, options: Options): Promise<T | T[]>
async function deleteLocal<T extends TypeWithID = any>(payload: Payload, options: Options): Promise<T | T[]> {
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
    throw new APIError(`The collection with slug ${collectionSlug} can't be found.`);
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
    return deleteByID(args);
  }
  return deleteOperation(args);
}

export default deleteLocal;
