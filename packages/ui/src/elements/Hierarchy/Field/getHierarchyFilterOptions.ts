import type { FilterOptionsResult, SanitizedHierarchyConfig, Where } from 'payload'

import { combineWhereConstraints } from 'payload/shared'

export const getHierarchyFilterOptions = ({
  baseFilter,
  documentCollectionSlug,
  filterOptions,
  hierarchyConfig,
  hierarchySlug,
}: {
  baseFilter?: null | Where
  documentCollectionSlug?: string
  filterOptions?: FilterOptionsResult
  hierarchyConfig?: Pick<SanitizedHierarchyConfig, 'collectionSpecific' | 'relatedCollections'>
  hierarchySlug: string
}): FilterOptionsResult | undefined => {
  const existingFilter = filterOptions?.[hierarchySlug]

  if (existingFilter === false) {
    return filterOptions
  }

  let collectionFilter: undefined | Where

  if (documentCollectionSlug && hierarchyConfig?.collectionSpecific) {
    const typeFieldName = hierarchyConfig.collectionSpecific.fieldName
    const configuredTypes = Object.keys(hierarchyConfig.relatedCollections)

    collectionFilter = {
      or: [
        { [typeFieldName]: { in: [documentCollectionSlug] } },
        { [typeFieldName]: { exists: false } },
        ...(configuredTypes.length > 0 ? [{ [typeFieldName]: { not_in: configuredTypes } }] : []),
      ],
    }
  }

  if (!baseFilter && !collectionFilter) {
    return filterOptions
  }

  return {
    ...filterOptions,
    [hierarchySlug]: combineWhereConstraints([
      typeof existingFilter === 'object' ? existingFilter : undefined,
      baseFilter ?? undefined,
      collectionFilter,
    ]),
  }
}
