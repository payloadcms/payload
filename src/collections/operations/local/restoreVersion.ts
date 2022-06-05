import { Payload } from '../../..';
import { Document } from '../../../types';
import { TypeWithVersion } from '../../../versions/types';
import { PayloadRequest } from '../../../express/types';
import restoreVersion from '../restoreVersion';

export type Options = {
  collection: string
  id: string
  data: Record<string, unknown>
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

export default async function restoreVersionHandler<T extends TypeWithVersion<T> = any>(payload: Payload, options: Options): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    data,
    id,
    user,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const collection = this.collections[collectionSlug];

  const args = {
    depth,
    data,
    collection,
    overrideAccess,
    id,
    showHiddenFields,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload,
    } as PayloadRequest,
  };

  return restoreVersion(args);
}
