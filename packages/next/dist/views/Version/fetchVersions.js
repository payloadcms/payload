import { logError } from 'payload';
export const fetchVersion = async ({
  id,
  collectionSlug,
  depth,
  globalSlug,
  locale,
  overrideAccess,
  req,
  select,
  user
}) => {
  try {
    if (collectionSlug) {
      return await req.payload.findVersionByID({
        id: String(id),
        collection: collectionSlug,
        depth,
        locale,
        overrideAccess,
        req,
        select,
        user
      });
    } else if (globalSlug) {
      return await req.payload.findGlobalVersionByID({
        id: String(id),
        slug: globalSlug,
        depth,
        locale,
        overrideAccess,
        req,
        select,
        user
      });
    }
  } catch (err) {
    logError({
      err,
      payload: req.payload
    });
    return null;
  }
};
export const fetchVersions = async ({
  collectionSlug,
  depth,
  draft,
  globalSlug,
  limit,
  locale,
  overrideAccess,
  page,
  parentID,
  req,
  select,
  sort,
  user,
  where: whereFromArgs
}) => {
  const where = {
    and: [...(whereFromArgs ? [whereFromArgs] : [])]
  };
  try {
    if (collectionSlug) {
      if (parentID) {
        where.and.push({
          parent: {
            equals: parentID
          }
        });
      }
      return await req.payload.findVersions({
        collection: collectionSlug,
        depth,
        draft,
        limit,
        locale,
        overrideAccess,
        page,
        req,
        select,
        sort,
        user,
        where
      });
    } else if (globalSlug) {
      return await req.payload.findGlobalVersions({
        slug: globalSlug,
        depth,
        limit,
        locale,
        overrideAccess,
        page,
        req,
        select,
        sort,
        user,
        where
      });
    }
  } catch (err) {
    logError({
      err,
      payload: req.payload
    });
    return null;
  }
};
export const fetchLatestVersion = async ({
  collectionSlug,
  depth,
  globalSlug,
  locale,
  overrideAccess,
  parentID,
  req,
  select,
  status,
  user,
  where
}) => {
  // Get the entity config to check if drafts are enabled
  const entityConfig = collectionSlug ? req.payload.collections[collectionSlug]?.config : globalSlug ? req.payload.globals[globalSlug]?.config : undefined;
  // Only query by _status if drafts are enabled (since _status field only exists with drafts)
  const draftsEnabled = entityConfig?.versions?.drafts;
  const and = [...(draftsEnabled ? [{
    'version._status': {
      equals: status
    }
  }] : []), ...(where ? [where] : [])];
  const latest = await fetchVersions({
    collectionSlug,
    depth,
    draft: true,
    globalSlug,
    limit: 1,
    locale,
    overrideAccess,
    parentID,
    req,
    select,
    sort: '-updatedAt',
    user,
    where: {
      and
    }
  });
  return latest?.docs?.length ? latest.docs[0] : null;
};
//# sourceMappingURL=fetchVersions.js.map