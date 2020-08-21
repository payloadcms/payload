async function update(options) {
  const {
    collection: collectionSlug,
    depth,
    locale,
    fallbackLocale,
    data,
    id,
  } = options;

  const collection = this.collections[collectionSlug];

  const args = {
    depth,
    data,
    collection,
    overrideAccess: true,
    id,
    req: {
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  };

  if (collection.config.auth) {
    return this.operations.collections.auth.update(args);
  }

  return this.operations.collections.update(args);
}

module.exports = update;
