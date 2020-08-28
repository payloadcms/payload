async function localDelete(options) {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale,
    fallbackLocale,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.delete({
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

module.exports = localDelete;
