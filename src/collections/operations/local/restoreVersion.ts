import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import { getDataLoader } from '../../dataloader';
import restoreVersion from '../restoreVersion';
import i18nInit from '../../../translations/init';
import { APIError } from '../../../errors';

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  id: string
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

export default async function restoreVersionLocal<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<GeneratedTypes['collections'][T]> {
  const {
    collection: collectionSlug,
    depth,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    id,
    user,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const collection = payload.collections[collectionSlug];

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
  }

  const i18n = i18nInit(payload.config.i18n);
  const req = {
    user,
    payloadAPI: 'local',
    locale,
    fallbackLocale,
    payload,
    i18n,
    t: i18n.t,
  } as PayloadRequest;

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  const args = {
    payload,
    depth,
    collection,
    overrideAccess,
    id,
    showHiddenFields,
    req,
  };

  return restoreVersion(args);
}
