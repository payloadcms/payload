import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';

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

export default async function findByID(options: Options): Promise<Document> {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
    req,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.findByID({
    depth,
    id,
    collection,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    req: {
      ...req,
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}
