export function supportsHierarchyContents({
  collection,
}: {
  collection: { hierarchy?: { allowHasMany?: boolean } | boolean; nestedDocs?: unknown }
}): boolean {
  return (
    typeof collection.hierarchy === 'object' &&
    collection.hierarchy !== null &&
    collection.hierarchy.allowHasMany === false &&
    !collection.nestedDocs
  )
}
