import { sanitizeID } from '@payloadcms/ui/shared'
import {
  combineQueries,
  extractAccessFromPermission,
  type Payload,
  type SanitizedCollectionConfig,
  type SanitizedDocumentPermissions,
  type SanitizedGlobalConfig,
  type TypedUser,
} from 'payload'

type Args = {
  collectionConfig?: SanitizedCollectionConfig
  /**
   * Optional - performance optimization.
   * If a document has been fetched before fetching versions, pass it here.
   * If this document is set to published, we can skip the query to find out if a published document exists,
   * as the passed in document is proof of its existence.
   */
  doc?: Record<string, any>
  docPermissions: SanitizedDocumentPermissions
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  locale?: string
  payload: Payload
  user: TypedUser
}

type Result = Promise<{
  hasPublishedDoc: boolean
  mostRecentVersionIsAutosaved: boolean
  unpublishedVersionCount: number
  versionCount: number
}>

// TODO: in the future, we can parallelize some of these queries
// this will speed up the API by ~30-100ms or so
// Note from the future: I have attempted parallelizing these queries, but it made this function almost 2x slower.
export const getVersions = async ({
  id: idArg,
  collectionConfig,
  doc,
  docPermissions,
  globalConfig,
  locale,
  payload,
  user,
}: Args): Result => {
  const id = sanitizeID(idArg)
  let publishedDoc
  let hasPublishedDoc = false
  let mostRecentVersionIsAutosaved = false
  let unpublishedVersionCount = 0
  let versionCount = 0

  const entityConfig = collectionConfig || globalConfig
  const versionsConfig = entityConfig?.versions

  const shouldFetchVersions = Boolean(versionsConfig && docPermissions?.readVersions)

  if (!shouldFetchVersions) {
    const hasPublishedDoc = Boolean((collectionConfig && id) || globalConfig)

    return {
      hasPublishedDoc,
      mostRecentVersionIsAutosaved,
      unpublishedVersionCount,
      versionCount,
    }
  }

  if (collectionConfig) {
    if (!id) {
      return {
        hasPublishedDoc,
        mostRecentVersionIsAutosaved,
        unpublishedVersionCount,
        versionCount,
      }
    }

    if (versionsConfig?.drafts) {
      // Find out if a published document exists
      if (doc?._status === 'published') {
        publishedDoc = doc
      } else {
        publishedDoc = (
          await payload.find({
            collection: collectionConfig.slug,
            depth: 0,
            limit: 1,
            locale: locale || undefined,
            pagination: false,
            select: {
              updatedAt: true,
            },
            user,
            where: {
              and: [
                {
                  or: [
                    {
                      _status: {
                        equals: 'published',
                      },
                    },
                    {
                      _status: {
                        exists: false,
                      },
                    },
                  ],
                },
                {
                  id: {
                    equals: id,
                  },
                },
              ],
            },
          })
        )?.docs?.[0]
      }

      if (publishedDoc) {
        hasPublishedDoc = true
      }

      if (versionsConfig.drafts?.autosave) {
        const mostRecentVersion = await payload.findVersions({
          collection: collectionConfig.slug,
          depth: 0,
          limit: 1,
          select: {
            autosave: true,
          },
          user,
          where: combineQueries(
            {
              and: [
                {
                  parent: {
                    equals: id,
                  },
                },
              ],
            },
            extractAccessFromPermission(docPermissions.readVersions),
          ),
        })

        if (
          mostRecentVersion.docs[0] &&
          'autosave' in mostRecentVersion.docs[0] &&
          mostRecentVersion.docs[0].autosave
        ) {
          mostRecentVersionIsAutosaved = true
        }
      }

      if (publishedDoc?.updatedAt) {
        ;({ totalDocs: unpublishedVersionCount } = await payload.countVersions({
          collection: collectionConfig.slug,
          user,
          where: combineQueries(
            {
              and: [
                {
                  parent: {
                    equals: id,
                  },
                },
                {
                  'version._status': {
                    equals: 'draft',
                  },
                },
                {
                  updatedAt: {
                    greater_than: publishedDoc.updatedAt,
                  },
                },
              ],
            },
            extractAccessFromPermission(docPermissions.readVersions),
          ),
        }))
      }
    }

    ;({ totalDocs: versionCount } = await payload.countVersions({
      collection: collectionConfig.slug,
      depth: 0,
      user,
      where: combineQueries(
        {
          and: [
            {
              parent: {
                equals: id,
              },
            },
          ],
        },
        extractAccessFromPermission(docPermissions.readVersions),
      ),
    }))
  }

  if (globalConfig) {
    // Find out if a published document exists
    if (versionsConfig?.drafts) {
      if (doc?._status === 'published') {
        publishedDoc = doc
      } else {
        publishedDoc = await payload.findGlobal({
          slug: globalConfig.slug,
          depth: 0,
          locale,
          select: {
            updatedAt: true,
          },
          user,
        })
      }

      if (publishedDoc?._status === 'published') {
        hasPublishedDoc = true
      }

      if (versionsConfig.drafts?.autosave) {
        const mostRecentVersion = await payload.findGlobalVersions({
          slug: globalConfig.slug,
          limit: 1,
          select: {
            autosave: true,
          },
          user,
        })

        if (
          mostRecentVersion.docs[0] &&
          'autosave' in mostRecentVersion.docs[0] &&
          mostRecentVersion.docs[0].autosave
        ) {
          mostRecentVersionIsAutosaved = true
        }
      }

      if (publishedDoc?.updatedAt) {
        ;({ totalDocs: unpublishedVersionCount } = await payload.countGlobalVersions({
          depth: 0,
          global: globalConfig.slug,
          user,
          where: combineQueries(
            {
              and: [
                {
                  'version._status': {
                    equals: 'draft',
                  },
                },
                {
                  updatedAt: {
                    greater_than: publishedDoc.updatedAt,
                  },
                },
              ],
            },
            extractAccessFromPermission(docPermissions.readVersions),
          ),
        }))
      }
    }

    ;({ totalDocs: versionCount } = await payload.countGlobalVersions({
      depth: 0,
      global: globalConfig.slug,
      user,
    }))
  }

  return {
    hasPublishedDoc,
    mostRecentVersionIsAutosaved,
    unpublishedVersionCount,
    versionCount,
  }
}
