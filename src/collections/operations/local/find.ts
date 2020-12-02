import { FindOptions } from '../../../types';

export default async function find(options: FindOptions) {
  const {
    collection: collectionSlug,
    depth,
    page,
    limit,
    where,
    locale,
    fallbackLocale,
    user,
    overrideAccess = true,
    showHiddenFields,
    sort,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.find({
    depth,
    sort,
    page,
    limit,
    where,
    collection,
    overrideAccess,
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
