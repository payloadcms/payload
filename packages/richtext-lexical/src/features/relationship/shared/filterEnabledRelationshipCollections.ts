import type { CollectionConfig, CollectionSlug } from 'payload'

export const filterEnabledRelationshipCollections = (
  collections: CollectionConfig[],
  {
    disabledCollections,
    enabledCollections,
    uploads,
  }: {
    disabledCollections?: CollectionSlug[]
    enabledCollections?: CollectionSlug[]
    uploads: boolean
  },
): CollectionConfig[] => {
  return collections.filter(({ slug, admin, upload }) => {
    if (!admin?.enableRichTextRelationship || Boolean(upload) !== uploads) {
      return false
    }

    if (enabledCollections && !enabledCollections.includes(slug)) {
      return false
    }

    if (disabledCollections?.includes(slug)) {
      return false
    }

    return true
  })
}
