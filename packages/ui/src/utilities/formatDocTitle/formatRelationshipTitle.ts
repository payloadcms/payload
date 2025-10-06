export const formatRelationshipTitle = (data): string => {
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          return item.id
        }
        return String(item)
      })
      .filter(Boolean)
      .join(', ')
  }

  if (typeof data === 'object' && data !== null) {
    return data.id || ''
  }

  return String(data)
}
