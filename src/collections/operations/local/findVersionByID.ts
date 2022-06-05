import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { TypeWithVersion } from '../../../versions/types';
import findVersionByID from '../findVersionByID';
import { Payload } from '../../..';

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
    locale = payload?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
    req,
  } = options;

  const collection = payload.collections[collectionSlug];

  return findVersionByID({
    depth,
    id,
    collection,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    payload,
    req: {
      ...req,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload,
    } as PayloadRequest,
  });
}
