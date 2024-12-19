export function hasChanges(a: unknown, b: unknown) {
  return JSON.stringify(a) !== JSON.stringify(b)
}
