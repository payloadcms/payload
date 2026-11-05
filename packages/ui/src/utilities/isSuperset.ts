/**
 * Check if allowedCollections is a superset of required collections.
 * Empty/undefined allowedCollections means unrestricted (allows all).
 */
export function isSuperset(allowedCollections: string[] | undefined, required: string[]): boolean {
  if (!allowedCollections || allowedCollections.length === 0) {
    return true
  }
  return required.every((slug) => allowedCollections.includes(slug))
}
