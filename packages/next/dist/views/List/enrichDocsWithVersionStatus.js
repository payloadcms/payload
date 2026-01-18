/**
 * Enriches list view documents with correct draft status display.
 * When draft=true is used in the query, Payload returns the latest draft version if it exists.
 * This function checks if draft documents also have a published version to determine "changed" status.
 *
 * Performance: Uses a single query to find all documents with "changed" status instead of N queries.
 */export async function enrichDocsWithVersionStatus({
  collectionConfig,
  data,
  req
}) {
  const draftsEnabled = collectionConfig?.versions?.drafts;
  if (!draftsEnabled || !data?.docs?.length) {
    return data;
  }
  // Find all draft documents
  // When querying with draft:true, we get the latest draft if it exists
  // We need to check if these drafts have a published version
  const draftDocs = data.docs.filter(doc => doc._status === 'draft');
  if (draftDocs.length === 0) {
    return data;
  }
  const draftDocIds = draftDocs.map(doc => doc.id).filter(Boolean);
  if (draftDocIds.length === 0) {
    return data;
  }
  // OPTIMIZATION: Single query to find all document IDs that have BOTH:
  // 1. A draft version (latest=true, _status='draft')
  // 2. A published version (_status='published')
  // These are the documents with "changed" status
  try {
    // TODO: This could be more efficient with a findDistinctVersions() API:
    // const { values } = await req.payload.findDistinctVersions({
    //   collection: collectionConfig.slug,
    //   field: 'parent',
    //   where: {
    //     and: [
    //       { parent: { in: draftDocIds } },
    //       { 'version._status': { equals: 'published' } },
    //     ],
    //   },
    // })
    // const hasPublishedVersionSet = new Set(values)
    //
    // For now, we query all published versions but only select the 'parent' field
    // to minimize data transfer, then deduplicate with a Set
    const publishedVersions = await req.payload.findVersions({
      collection: collectionConfig.slug,
      depth: 0,
      limit: 0,
      pagination: false,
      select: {
        parent: true
      },
      where: {
        and: [{
          parent: {
            in: draftDocIds
          }
        }, {
          'version._status': {
            equals: 'published'
          }
        }]
      }
    });
    // Create a Set of document IDs that have published versions
    const hasPublishedVersionSet = new Set(publishedVersions.docs.map(version => version.parent).filter(Boolean));
    // Enrich documents with display status
    const enrichedDocs = data.docs.map(doc => {
      // If it's a draft and has a published version, show "changed"
      if (doc._status === 'draft' && hasPublishedVersionSet.has(doc.id)) {
        return {
          ...doc,
          _displayStatus: 'changed'
        };
      }
      return {
        ...doc,
        _displayStatus: doc._status
      };
    });
    return {
      ...data,
      docs: enrichedDocs
    };
  } catch (error) {
    // If there's an error querying versions, just return the original data
    req.payload.logger.error({
      err: error,
      msg: `Error checking version status for collection ${collectionConfig.slug}`
    });
    return data;
  }
}
//# sourceMappingURL=enrichDocsWithVersionStatus.js.map