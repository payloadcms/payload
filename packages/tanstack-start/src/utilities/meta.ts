import { getViewportContent } from '@payloadcms/ui/layouts'

type MetaEntry =
  | { charSet: string }
  | { content: string; name: string }
  | { content: string; property: string }
  | { title: string }

type LinkEntry = {
  href: string
  media?: string
  rel: string
  sizes?: string
  type?: string
}

type AdminPageIcon = {
  media?: string
  rel?: string
  sizes?: string
  type?: string
  url: string
}

type AdminPageOGImage = {
  alt?: string
  height?: number
  url: string
  width?: number
}

/**
 * Resolved admin-page metadata produced by the admin-page server function.
 *
 * The server function resolves the framework-agnostic `MetaConfig` (via the
 * shared `generatePageMetadata` in `@payloadcms/ui`) down to plain serializable
 * values, so the route loader can ship it across the wire and feed it to
 * `getAdminMeta` in `head()`.
 */
export type AdminPageMetadata = {
  description?: string
  icons?: AdminPageIcon[]
  keywords?: string
  openGraph?: {
    description?: string
    images?: AdminPageOGImage[]
    siteName?: string
    title?: string
  }
  robots?: string
  title?: string
  viewport?: string
}

/**
 * Builds TanStack Router `head()` `meta` + `links` entries for an admin page
 * from the resolved `AdminPageMetadata`, mirroring the tags Next.js renders
 * natively from the same `MetaConfig` (title, description, robots, keywords,
 * OpenGraph, Twitter — derived from OpenGraph — and icon links).
 *
 * ```ts
 * export const Route = createFileRoute('/admin/$')({
 *   head: ({ loaderData }) => getAdminMeta(loaderData?.metadata),
 * })
 * ```
 */
export function getAdminMeta(metadata?: AdminPageMetadata): {
  links: LinkEntry[]
  meta: MetaEntry[]
} {
  const meta: MetaEntry[] = [
    { charSet: 'utf-8' },
    { name: 'viewport', content: metadata?.viewport ?? getViewportContent() },
  ]
  const links: LinkEntry[] = []

  if (!metadata) {
    return { links, meta }
  }

  if (metadata.title) {
    meta.push({ title: metadata.title })
  }
  if (metadata.description) {
    meta.push({ name: 'description', content: metadata.description })
  }
  if (metadata.keywords) {
    meta.push({ name: 'keywords', content: metadata.keywords })
  }
  if (metadata.robots) {
    meta.push({ name: 'robots', content: metadata.robots })
  }

  const og = metadata.openGraph
  if (og) {
    if (og.title) {
      meta.push({ content: og.title, property: 'og:title' })
    }
    if (og.description) {
      meta.push({ content: og.description, property: 'og:description' })
    }
    if (og.siteName) {
      meta.push({ content: og.siteName, property: 'og:site_name' })
    }

    for (const image of og.images ?? []) {
      meta.push({ content: image.url, property: 'og:image' })
      if (image.width) {
        meta.push({ content: String(image.width), property: 'og:image:width' })
      }
      if (image.height) {
        meta.push({ content: String(image.height), property: 'og:image:height' })
      }
      if (image.alt) {
        meta.push({ content: image.alt, property: 'og:image:alt' })
      }
    }

    // Twitter card is inherited from OpenGraph (matches Next.js metadata resolution).
    const firstImage = og.images?.[0]
    if (firstImage) {
      meta.push({ name: 'twitter:card', content: 'summary_large_image' })
      meta.push({ name: 'twitter:image', content: firstImage.url })
    }
    if (og.title) {
      meta.push({ name: 'twitter:title', content: og.title })
    }
    if (og.description) {
      meta.push({ name: 'twitter:description', content: og.description })
    }
  }

  for (const icon of metadata.icons ?? []) {
    links.push({
      href: icon.url,
      rel: icon.rel ?? 'icon',
      ...(icon.media ? { media: icon.media } : {}),
      ...(icon.sizes ? { sizes: icon.sizes } : {}),
      ...(icon.type ? { type: icon.type } : {}),
    })
  }

  return { links, meta }
}
