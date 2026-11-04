import type { PaginatedDocs, PayloadRequest, SanitizedCollectionConfig } from 'payload'

/**
 * Enriches list view documents with correct draft status display.
 * When draft=true is used in the query, Payload returns the latest draft version if it exists.
 * This function checks if draft documents also have a published version to determine "changed" status.
 *
 * Performance: Uses a single query to find all documents with "changed" status instead of N queries.
 */
export async function enrichDocsWithVersionStatus({
  collectionConfig,
  data,
  req,
}: {
  collectionConfig: SanitizedCollectionConfig
  data: PaginatedDocs
  req: PayloadRequest
}): Promise<PaginatedDocs> {
  const draftsEnabled = collectionConfig?.versions?.drafts

  if (!draftsEnabled || !data?.docs?.length) {
    return data
  }

  // Find all draft documents
  // When querying with draft:true, we get the latest draft if it exists
  // We need to check if these drafts have a published version
  const draftDocs = data.docs.filter((doc) => doc._status === 'draft')

  if (draftDocs.length === 0) {
    return data
  }

  const draftDocIds = draftDocs.map((doc) => doc.id).filter(Boolean)

  if (draftDocIds.length === 0) {
    return data
  }

  try {
    const publishedDocuments = await req.payload.find({
      collection: collectionConfig.slug,
      depth: 0,
      limit: 0,
      locale: req.locale,
      overrideAccess: false,
      pagination: false,
      req,
      select: {
        id: true,
      },
      user: req.user,
      where: {
        and: [
          {
            id: {
              in: draftDocIds,
            },
          },
          {
            _status: {
              equals: 'published',
            },
          },
        ],
      },
    })

    const hasPublishedDocumentSet = new Set(publishedDocuments.docs.map(({ id }) => id))

    // Enrich documents with display status
    const enrichedDocs = data.docs.map((doc) => {
      // If it's a draft and has a published version, show "changed"
      if (doc._status === 'draft' && hasPublishedDocumentSet.has(doc.id)) {
        return {
          ...doc,
          _displayStatus: 'changed' as const,
        }
      }

      return {
        ...doc,
        _displayStatus: doc._status as 'draft' | 'published',
      }
    })

    return {
      ...data,
      docs: enrichedDocs,
    }
  } catch (error) {
    // If there's an error querying versions, just return the original data
    req.payload.logger.error({
      err: error,
      msg: `Error checking published status for collection ${collectionConfig.slug}`,
    })
    return data
  }
}
