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
}

export default async function findByID(options: Options): Promise<Document> {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale,
    fallbackLocale,
    user,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
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
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}
