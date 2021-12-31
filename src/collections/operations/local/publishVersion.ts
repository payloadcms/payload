import { Document } from '../../../types';
import { TypeWithVersion } from '../../../versions/types';

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

export default async function publishVersion<T extends TypeWithVersion<T> = any>(options: Options): Promise<T> {
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
      payload: this,
    },
  };

  return this.operations.collections.publishVersion(args);
}
