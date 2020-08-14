async function forgotPassword(options) {
  const {
    collection: collectionSlug,
    data,
    expiration,
    disableEmail,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.forgotPassword({
    data,
    collection,
    overrideAccess: true,
    disableEmail,
    expiration,
  });
}

module.exports = forgotPassword;
