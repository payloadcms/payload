import type {
  Payload,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
  TypedUser,
} from 'payload'

import { sanitizeID } from '@payloadcms/ui/shared'

type Args = {
  collectionConfig?: SanitizedCollectionConfig
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
export const getVersions = async ({
  id: idArg,
  collectionConfig,
  docPermissions,
  globalConfig,
  locale,
  payload,
  user,
}: Args): Result => {
  const id = sanitizeID(idArg)
  let publishedQuery
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
      publishedQuery = await payload.find({
        collection: collectionConfig.slug,
        depth: 0,
        locale: locale || undefined,
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

      if (publishedQuery.docs?.[0]) {
        hasPublishedDoc = true
      }

      if (versionsConfig.drafts?.autosave) {
        const mostRecentVersion = await payload.findVersions({
          collection: collectionConfig.slug,
          depth: 0,
          limit: 1,
          user,
          where: {
            and: [
              {
                parent: {
                  equals: id,
                },
              },
            ],
          },
        })

        if (
          mostRecentVersion.docs[0] &&
          'autosave' in mostRecentVersion.docs[0] &&
          mostRecentVersion.docs[0].autosave
        ) {
          mostRecentVersionIsAutosaved = true
        }
      }

      if (publishedQuery.docs?.[0]?.updatedAt) {
        ;({ totalDocs: unpublishedVersionCount } = await payload.countVersions({
          collection: collectionConfig.slug,
          user,
          where: {
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
                  greater_than: publishedQuery.docs[0].updatedAt,
                },
              },
            ],
          },
        }))
      }
    }

    ;({ totalDocs: versionCount } = await payload.countVersions({
      collection: collectionConfig.slug,
      user,
      where: {
        and: [
          {
            parent: {
              equals: id,
            },
          },
        ],
      },
    }))
  }

  if (globalConfig) {
    if (versionsConfig?.drafts) {
      publishedQuery = await payload.findGlobal({
        slug: globalConfig.slug,
        depth: 0,
        locale,
        user,
      })

      if (publishedQuery?._status === 'published') {
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

      if (publishedQuery?.updatedAt) {
        ;({ totalDocs: unpublishedVersionCount } = await payload.countGlobalVersions({
          depth: 0,
          global: globalConfig.slug,
          user,
          where: {
            and: [
              {
                'version._status': {
                  equals: 'draft',
                },
              },
              {
                updatedAt: {
                  greater_than: publishedQuery.updatedAt,
                },
              },
            ],
          },
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
