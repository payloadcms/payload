type MetaEntry = { charSet: string } | { content: string; name: string } | { title: string }

/**
 * Resolved admin-page metadata produced by the admin-page server function.
 *
 * The server function resolves the framework-agnostic `MetaConfig` (via the
 * shared `generatePageMetadata` in `@payloadcms/ui`) down to plain serializable
 * strings, so the route loader can ship it across the wire and feed it to
 * `getAdminMeta` in `head()`.
 */
export type AdminPageMetadata = {
  description?: string
  title?: string
}

/**
 * Generates TanStack Router `head.meta` entries for an admin page from the
 * resolved `AdminPageMetadata`.
 *
 * ```ts
 * export const Route = createFileRoute('/admin/$')({
 *   head: ({ loaderData }) => ({
 *     meta: getAdminMeta(loaderData?.metadata),
 *   }),
 * })
 * ```
 */
export function getAdminMeta(metadata?: AdminPageMetadata): MetaEntry[] {
  const meta: MetaEntry[] = [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ]

  if (metadata?.title) {
    meta.push({ title: metadata.title })
  }

  if (metadata?.description) {
    meta.push({ name: 'description', content: metadata.description })
  }

  return meta
}
