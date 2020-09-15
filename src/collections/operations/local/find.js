async function find(options) {
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
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.find({
    depth,
    page,
    limit,
    where,
    collection,
    overrideAccess,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}

module.exports = find;
