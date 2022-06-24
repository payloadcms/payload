import { TypeWithID } from '../../config/types';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../../index';
import deleteOperation from '../delete';

export type Options = {
  collection: string
  id: string
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

export default async function deleteLocal<T extends TypeWithID = any>(payload: Payload, options: Options): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const collection = payload.collections[collectionSlug];

  return deleteOperation({
    depth,
    id,
    collection,
    overrideAccess,
    showHiddenFields,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload,
    } as PayloadRequest,
  });
}
