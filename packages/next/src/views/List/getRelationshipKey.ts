// Helper function to get a unique key for deduplication
export const getRelationshipKey = (value: any): string => {
  if (value === null || value === undefined) {
    return 'null'
  }
  if (typeof value === 'object' && value?.relationTo && value?.value) {
    return `${value.relationTo}:${value.value?.id || value.value}`
  }
  if (typeof value === 'object' && value?.id) {
    return value.id
  }
  return String(value)
}
