import { Payload } from '../../..';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import { TypeWithVersion } from '../../../versions/types';
import { getDataLoader } from '../../dataloader';
import restoreVersion from '../restoreVersion';
import i18n from '../../../translations/init';

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

export default async function restoreVersionLocal<T extends TypeWithVersion<T> = any>(payload: Payload, options: Options): Promise<T> {
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

  const req = {
    user,
    payloadAPI: 'local',
    locale,
    fallbackLocale,
    payload,
    i18n: i18n(payload.config.i18n),
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
