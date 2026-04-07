import type { ClientConfig } from 'payload'

type MetaEntry = { charSet: string } | { content: string; name: string } | { title: string }

/**
 * Generates TanStack Router `head.meta` entries for an admin page.
 *
 * Use in a route's `head` function to set the page title and meta tags:
 *
 * ```ts
 * export const Route = createFileRoute('/admin/$')({
 *   head: ({ loaderData }) => ({
 *     meta: getAdminMeta({
 *       clientConfig: loaderData.clientConfig,
 *       viewType: loaderData.viewType,
 *     }),
 *   }),
 * })
 * ```
 */
export function getAdminMeta({
  clientConfig,
  collectionLabel,
  globalLabel,
  title,
  viewType,
}: {
  clientConfig?: ClientConfig
  collectionLabel?: string
  globalLabel?: string
  title?: string
  viewType?: string
}): MetaEntry[] {
  const siteName = clientConfig?.admin?.meta?.titleSuffix ?? 'Payload Admin'
  let pageTitle = title

  if (!pageTitle) {
    switch (viewType) {
      case 'account':
        pageTitle = `Account | ${siteName}`
        break
      case 'dashboard':
        pageTitle = `Dashboard | ${siteName}`
        break
      case 'document':
        pageTitle =
          collectionLabel || globalLabel
            ? `${collectionLabel || globalLabel} | ${siteName}`
            : siteName
        break
      case 'list':
        pageTitle = collectionLabel ? `${collectionLabel} | ${siteName}` : siteName
        break
      default:
        pageTitle = siteName
    }
  }

  return [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { title: pageTitle },
  ]
}
