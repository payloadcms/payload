async function login(options) {
  const {
    collection: collectionSlug,
    res,
    depth,
    locale,
    fallbackLocale,
    data,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.login({
    depth,
    collection,
    overrideAccess: true,
    data,
    req: {
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
    res,
  });
}

module.exports = login;
