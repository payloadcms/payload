import type { MetaConfig } from 'payload'

import { getViewportContent } from '@payloadcms/ui/shared'

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

/**
 * Flattens the framework-agnostic `MetaConfig` (Next.js `Metadata` shape) into
 * the plain, serializable `AdminPageMetadata` the route loader ships to the
 * client. The full `MetaConfig` carries a `URL` `metadataBase`, functions and
 * other non-serializable values that seroval cannot cross the wire, so only the
 * fields `getAdminMeta` renders are extracted.
 */
export const toAdminPageMetadata = (meta: MetaConfig): AdminPageMetadata => {
  const og = meta.openGraph as
    | {
        description?: unknown
        images?: unknown
        siteName?: unknown
        title?: unknown
      }
    | undefined

  const rawImages = og?.images
  const imagesArray = rawImages ? (Array.isArray(rawImages) ? rawImages : [rawImages]) : []
  const images = imagesArray
    .map((image: any) =>
      typeof image === 'string'
        ? { url: image }
        : image?.url
          ? { alt: image.alt, height: image.height, url: String(image.url), width: image.width }
          : undefined,
    )
    .filter(Boolean) as NonNullable<AdminPageMetadata['openGraph']>['images']

  const rawIcons = meta.icons as any
  const iconList = Array.isArray(rawIcons)
    ? rawIcons
    : rawIcons && typeof rawIcons === 'object' && Array.isArray(rawIcons.icon)
      ? rawIcons.icon
      : []
  const icons = iconList
    .map((icon: any) =>
      typeof icon === 'string'
        ? { rel: 'icon', url: icon }
        : icon?.url
          ? {
              type: icon.type,
              media: icon.media,
              rel: icon.rel ?? 'icon',
              sizes: icon.sizes,
              url: String(icon.url),
            }
          : undefined,
    )
    .filter(Boolean) as AdminPageMetadata['icons']

  const keywords = meta.keywords

  return {
    description: typeof meta.description === 'string' ? meta.description : undefined,
    icons: icons?.length ? icons : undefined,
    keywords:
      typeof keywords === 'string'
        ? keywords
        : Array.isArray(keywords)
          ? keywords.join(', ')
          : undefined,
    openGraph: og
      ? {
          description: typeof og.description === 'string' ? og.description : undefined,
          images: images?.length ? images : undefined,
          siteName: typeof og.siteName === 'string' ? og.siteName : undefined,
          title: typeof og.title === 'string' ? og.title : undefined,
        }
      : undefined,
    robots: typeof meta.robots === 'string' ? meta.robots : undefined,
    title: resolveTitle(meta.title),
  }
}

const resolveTitle = (title: MetaConfig['title']): string | undefined => {
  if (!title) {
    return undefined
  }
  if (typeof title === 'string') {
    return title
  }
  if ('absolute' in title) {
    return title.absolute
  }
  return title.default
}
