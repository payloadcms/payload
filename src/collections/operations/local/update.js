async function update(options) {
  const {
    collection: collectionSlug,
    depth,
    locale,
    fallbackLocale,
    data,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.update({
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

module.exports = update;
