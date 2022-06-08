import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { TypeWithVersion } from '../../../versions/types';

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

export default async function findVersionByID<T extends TypeWithVersion<T> = any>(options: Options): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
    req,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.findVersionByID({
    depth,
    id,
    collection,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    req: {
      ...req || {},
      payloadAPI: 'local',
      locale: locale || req?.locale || this?.config?.localization?.defaultLocale,
      fallbackLocale: fallbackLocale || req?.fallbackLocale || null,
      payload: this,
    },
  });
}
