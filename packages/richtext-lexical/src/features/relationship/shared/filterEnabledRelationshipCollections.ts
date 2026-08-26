type CollectionLike = {
  admin?: {
    enableRichTextRelationship?: boolean
  }
  slug: string
  upload?: unknown
}

export type FilterEnabledRelationshipCollectionsOptions = {
  /** `disabledCollections` feature prop — slug blacklist. */
  disabledCollections?: readonly string[]
  /** `enabledCollections` feature prop — slug whitelist. */
  enabledCollections?: readonly string[]
  /** When `true`, only upload-enabled collections; when `false`, only non-upload ones. */
  uploads: boolean
  /**
   * Slugs the current user can see, supplied by the client at runtime.
   * Server-side type generation passes `undefined` to skip the check.
   */
  visibleSlugs?: readonly string[]
}

export const filterEnabledRelationshipCollections = <TCollection extends CollectionLike>(
  collections: readonly TCollection[],
  {
    disabledCollections,
    enabledCollections,
    uploads,
    visibleSlugs,
  }: FilterEnabledRelationshipCollectionsOptions,
): TCollection[] => {
  const whitelistSet = enabledCollections?.length ? new Set(enabledCollections) : null
  const blacklistSet = disabledCollections?.length ? new Set(disabledCollections) : null

  return collections.filter((collection) => {
    const { slug, admin, upload } = collection

    if (visibleSlugs && !visibleSlugs.includes(slug)) {
      return false
    }

    if (uploads) {
      if (!admin?.enableRichTextRelationship || !upload) {
        return false
      }
    } else if (upload || !admin?.enableRichTextRelationship) {
      return false
    }

    if (whitelistSet && !whitelistSet.has(slug)) {
      return false
    }
    if (blacklistSet && blacklistSet.has(slug)) {
      return false
    }

    return true
  })
}
