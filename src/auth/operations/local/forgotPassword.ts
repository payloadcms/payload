async function forgotPassword(options) {
  const {
    collection: collectionSlug,
    data,
    expiration,
    disableEmail,
    req,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.forgotPassword({
    data,
    collection,
    overrideAccess: true,
    disableEmail,
    expiration,
    req: {
      ...req,
      payloadAPI: 'local',
      payload: this,
    },
  });
}

module.exports = forgotPassword;
