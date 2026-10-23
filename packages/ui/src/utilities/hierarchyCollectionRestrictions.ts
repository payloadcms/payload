import type { ClientCollectionConfig } from 'payload'

type ClientHierarchyConfig = Exclude<ClientCollectionConfig['hierarchy'], boolean | undefined>

export function getHierarchyCollectionRestrictions({
  collectionConfig,
}: {
  collectionConfig?: ClientCollectionConfig
}): {
  hierarchyConfig?: ClientHierarchyConfig
  relatedCollectionSlugs: string[]
  typeFieldName?: string
} {
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined

  return {
    hierarchyConfig,
    relatedCollectionSlugs: Object.keys(hierarchyConfig?.relatedCollections ?? {}),
    typeFieldName: hierarchyConfig?.collectionSpecific
      ? hierarchyConfig.collectionSpecific.fieldName
      : undefined,
  }
}

export function getEffectiveHierarchyCollections({
  allowedCollections,
  relatedCollectionSlugs,
}: {
  allowedCollections?: null | string[]
  relatedCollectionSlugs: string[]
}): string[] {
  return allowedCollections?.length ? allowedCollections : relatedCollectionSlugs
}
