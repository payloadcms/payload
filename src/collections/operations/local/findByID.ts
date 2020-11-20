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

module.exports = findByID;
