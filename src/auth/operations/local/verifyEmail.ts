async function verifyEmail(options) {
  const {
    collection: collectionSlug,
    token,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.verifyEmail({
    token,
    collection,
  });
}

export default verifyEmail;
