async function localDelete(options) {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale,
    fallbackLocale,
    user,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.delete({
    depth,
    id,
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

module.exports = localDelete;
