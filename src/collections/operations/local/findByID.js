async function findByID(options) {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale,
    fallbackLocale,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.findByID({
    depth,
    id,
    collection,
    overrideAccess: true,
    req: {
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}

module.exports = findByID;
