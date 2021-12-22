import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { TypeWithRevision } from '../../../revisions/types';

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

export default async function findRevisionByID<T extends TypeWithRevision<T> = any>(options: Options): Promise<T> {
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

  return this.operations.collections.findRevisionByID({
    depth,
    id,
    collection,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    req: {
      ...req,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}
