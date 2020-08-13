async function forgotPassword(options) {
  const {
    collection: collectionSlug,
    data,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.forgotPassword({
    data,
    collection,
    overrideAccess: true,
  });
}

module.exports = forgotPassword;
