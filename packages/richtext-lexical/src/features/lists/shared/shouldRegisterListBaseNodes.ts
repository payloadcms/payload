// Priority order: unordered > ordered > checklist.
// That's why we don't include unordered among the parameter options. It registers by default.
export function shouldRegisterListBaseNodes(
  type: 'checklist' | 'ordered',
  featureProviderMap: Map<string, unknown>,
) {
  if (type === 'ordered') {
    // OrderedList only registers if UnorderedList is NOT present
    return !featureProviderMap.has('unorderedList')
  }

  if (type === 'checklist') {
    // Checklist only registers if neither UnorderedList nor OrderedList are present
    return !featureProviderMap.has('unorderedList') && !featureProviderMap.has('orderedList')
  }

  return false
}
