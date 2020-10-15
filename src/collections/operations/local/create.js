async function create(options) {
  const {
    collection: collectionSlug,
    depth,
    locale,
    fallbackLocale,
    data,
    user,
    overrideAccess = true,
    disableVerificationEmail,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.create({
    depth,
    data,
    collection,
    overrideAccess,
    disableVerificationEmail,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}

module.exports = create;
