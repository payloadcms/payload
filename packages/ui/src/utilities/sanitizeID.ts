export function sanitizeID(id: number | string): number | string {
  if (id === undefined) {
    return id
  }

  if (typeof id === 'number') {
    return id
  }

  return decodeURIComponent(id)
}
