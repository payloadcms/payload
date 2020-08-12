async function register(options) {
  const {
    collection: collectionSlug,
    depth,
    locale,
    fallbackLocale,
    data,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.register({
    depth,
    data,
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

module.exports = register;
