/** Keeps failure state local to a document, field path, locale, and array entry. */
export function getComponentInstanceKey({ key, props }: { key?: string; props: object }): string {
  const identityProps = ['collectionSlug', 'globalSlug', 'docID', 'path', 'locale'] as const

  return JSON.stringify([
    key,
    ...identityProps.map((name) => {
      const value: unknown = props[name]

      return typeof value === 'string' || typeof value === 'number' ? value : null
    }),
  ])
}
