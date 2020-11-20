export default async function find(options) {
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
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.find({
    depth,
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
