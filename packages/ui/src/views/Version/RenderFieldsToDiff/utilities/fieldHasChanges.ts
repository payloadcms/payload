export function fieldHasChanges(a: unknown, b: unknown) {
  if (a == null && b == null) {
    return false
  }

  return JSON.stringify(a) !== JSON.stringify(b)
}
