async function find(options) {
  const {
    collection: collectionSlug,
    depth,
    page,
    limit,
    where,
    locale,
    fallbackLocale,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.find({
    depth,
    page,
    limit,
    where,
    collection,
    overrideAccess: true,
    req: {
      payloadAPI: 'local',
      locale,
      fallbackLocale,
    },
  });
}

module.exports = find;
