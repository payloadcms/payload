async function unlock(options) {
  const {
    collection: collectionSlug,
    data,
    overrideAccess = true,
    req,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.unlock({
    data,
    collection,
    overrideAccess,
    req,
  });
}

export default unlock;
