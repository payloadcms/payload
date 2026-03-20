import { sanitizeID, traverseForLocalizedFields } from '@payloadcms/ui/shared'
import {
  combineQueries,
  extractAccessFromPermission,
  type Payload,
  type SanitizedCollectionConfig,
  type SanitizedDocumentPermissions,
  type SanitizedGlobalConfig,
  type TypedUser,
} from 'payload'
import { hasAutosaveEnabled, hasDraftsEnabled } from 'payload/shared'

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
  const hasLocalizedFields = traverseForLocalizedFields(entityConfig.fields)
  const localizedDraftsEnabled =
    hasDraftsEnabled(entityConfig) &&
    typeof payload.config.localization === 'object' &&
    hasLocalizedFields

  const shouldFetchVersions = Boolean(versionsConfig && docPermissions?.readVersions)

  if (!shouldFetchVersions) {
    // Without readVersions permission, determine published status from the _status field
    const hasPublishedDoc = localizedDraftsEnabled
      ? doc?._status === 'published'
      : doc?._status !== 'draft'

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

    if (hasDraftsEnabled(collectionConfig)) {
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
                  _status: {
                    equals: 'published',
                  },
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

      if (hasAutosaveEnabled(collectionConfig)) {
        const where: Record<string, any> = {
          and: [
            {
              parent: {
                equals: id,
              },
            },
          ],
        }

        if (localizedDraftsEnabled) {
          where.and.push({
            snapshot: {
              not_equals: true,
            },
          })
        }

        const mostRecentVersion = await payload.findVersions({
          collection: collectionConfig.slug,
          depth: 0,
          limit: 1,
          locale,
          select: {
            autosave: true,
          },
          user,
          where: combineQueries(where, extractAccessFromPermission(docPermissions.readVersions)),
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
          locale,
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

    const countVersionsWhere: Record<string, any> = {
      and: [
        {
          parent: {
            equals: id,
          },
        },
      ],
    }

    if (localizedDraftsEnabled) {
      countVersionsWhere.and.push({
        snapshot: {
          not_equals: true,
        },
      })
    }

    ;({ totalDocs: versionCount } = await payload.countVersions({
      collection: collectionConfig.slug,
      locale,
      user,
      where: combineQueries(
        countVersionsWhere,
        extractAccessFromPermission(docPermissions.readVersions),
      ),
    }))
  }

  if (globalConfig) {
    // Find out if a published document exists
    if (hasDraftsEnabled(globalConfig)) {
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

      if (hasAutosaveEnabled(globalConfig)) {
        const mostRecentVersion = await payload.findGlobalVersions({
          slug: globalConfig.slug,
          limit: 1,
          locale,
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
          global: globalConfig.slug,
          locale,
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
      global: globalConfig.slug,
      locale,
      user,
      where: localizedDraftsEnabled
        ? {
            snapshot: {
              not_equals: true,
            },
          }
        : undefined,
    }))
  }

  return {
    hasPublishedDoc,
    mostRecentVersionIsAutosaved,
    unpublishedVersionCount,
    versionCount,
  }
}
