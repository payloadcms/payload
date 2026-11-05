export type IndexedLocatorContext = {
  availableCount: number
  collectionSlug: string
  fieldPath: string
  index: number
  itemName: 'block' | 'row' | 'value'
  scope: string
  selector: string
}

const pluralize = (itemName: IndexedLocatorContext['itemName']): string => {
  return itemName === 'row' ? 'rows' : `${itemName}s`
}

export const formatIndexedLocatorContext = ({
  availableCount,
  collectionSlug,
  fieldPath,
  index,
  itemName,
  scope,
  selector,
}: IndexedLocatorContext): string => {
  const validIndexes = availableCount === 0 ? 'none' : `0-${availableCount - 1}`

  return [
    `Could not resolve ${itemName} ${index} for "${fieldPath}".`,
    `Collection: ${collectionSlug}`,
    `Scope: ${scope}`,
    `Field path: ${fieldPath}`,
    `Selector: ${selector}`,
    `Requested index: ${index}`,
    `Available ${pluralize(itemName)}: ${availableCount}`,
    `Valid indexes: ${validIndexes}`,
  ].join('\n')
}

export const formatBlockTypeContext = ({
  slug,
  collectionSlug,
  fieldPath,
  index,
  scope,
  selector,
}: { slug: string } & Omit<IndexedLocatorContext, 'availableCount' | 'itemName'>): string => {
  return [
    `Could not resolve block type "${slug}" at index ${index} for "${fieldPath}".`,
    `Collection: ${collectionSlug}`,
    `Scope: ${scope}`,
    `Field path: ${fieldPath}`,
    `Selector: ${selector}`,
    `Requested block type: ${slug}`,
  ].join('\n')
}
