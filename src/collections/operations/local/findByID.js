async function findByID(options) {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale,
    fallbackLocale,
    user,
    overrideAccess = true,
    disableErrors = false,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.findByID({
    depth,
    id,
    collection,
    overrideAccess,
    disableErrors,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}

module.exports = findByID;
