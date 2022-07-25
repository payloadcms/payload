import { Payload } from '../../..';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { TypeWithVersion } from '../../../versions/types';
import findVersionByID from '../findVersionByID';
import { getDataLoader } from '../../dataloader';

export type Options = {
  collection: string
  id: string
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  disableErrors?: boolean
  req?: PayloadRequest
}

export default async function findVersionByIDLocal<T extends TypeWithVersion<T> = any>(payload: Payload, options: Options): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
    req,
  } = options;

  const collection = payload.collections[collectionSlug];

  const reqToUse = {
    ...req || {},
    payloadAPI: 'local',
    locale: locale || req?.locale || this?.config?.localization?.defaultLocale,
    fallbackLocale: fallbackLocale || req?.fallbackLocale || null,
    payload,
  } as PayloadRequest;

  reqToUse.payloadDataLoader = getDataLoader(reqToUse);

  return findVersionByID({
    depth,
    id,
    collection,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    req: reqToUse,
  });
}
