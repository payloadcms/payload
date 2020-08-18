async function forgotPassword(options) {
  const {
    collection: collectionSlug,
    data,
    expiration,
    disableEmail,
    generateEmailHTML,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.forgotPassword({
    data,
    collection,
    overrideAccess: true,
    disableEmail,
    expiration,
    generateEmailHTML,
  });
}

module.exports = forgotPassword;
