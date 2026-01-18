import { createDataloaderCacheKey } from 'payload';
export const populate = async ({
  id,
  collectionSlug,
  currentDepth,
  data,
  depth,
  draft,
  key,
  overrideAccess,
  req,
  select,
  showHiddenFields
}) => {
  const shouldPopulate = depth && currentDepth <= depth;
  // usually depth is checked within recursivelyPopulateFieldsForGraphQL. But since this populate function can be called outside of that (in rest afterRead node hooks) we need to check here too
  if (!shouldPopulate) {
    return;
  }
  const dataRef = data;
  const doc = await req.payloadDataLoader?.load(createDataloaderCacheKey({
    collectionSlug,
    currentDepth: currentDepth + 1,
    depth,
    docID: id,
    draft,
    fallbackLocale: req.fallbackLocale,
    locale: req.locale,
    overrideAccess,
    select,
    showHiddenFields,
    transactionID: req.transactionID
  }));
  if (doc) {
    dataRef[key] = doc;
  } else {
    dataRef[key] = null;
  }
};
//# sourceMappingURL=populate.js.map