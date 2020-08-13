async function resetPassword(options) {
  const {
    collection: collectionSlug,
    data,
    req,
    res,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.resetPassword({
    data,
    collection,
    overrideAccess: true,
    req: {
      ...req,
      payloadAPI: 'local',
      payload: this,
    },
    res,
  });
}

module.exports = resetPassword;
