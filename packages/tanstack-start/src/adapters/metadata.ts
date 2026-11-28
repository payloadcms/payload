import type { MetaConfig } from 'payload'

import { getViewportContent } from '@payloadcms/ui/shared'

type MetaEntry =
  | { charSet: string }
  | { content: string; name: string }
  | { content: string; property: string }
  | { title: string }

type LinkEntry = {
  href: string
  hrefLang?: string
  media?: string
  rel: string
  sizes?: string
  title?: string
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

type AdminPageAlternate = {
  hrefLang?: string
  media?: string
  title?: string
  type?: string
  url: string
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
  alternates?: AdminPageAlternate[]
  applicationName?: string
  canonical?: string
  description?: string
  googleBot?: string
  icons?: AdminPageIcon[]
  keywords?: string
  manifest?: string
  openGraph?: {
    description?: string
    images?: AdminPageOGImage[]
    locale?: string
    siteName?: string
    title?: string
    type?: string
    url?: string
  }
  other?: { content: string; name: string }[]
  robots?: string
  title?: string
  twitter?: {
    card?: string
    creator?: string
    creatorId?: string
    description?: string
    images?: string[]
    site?: string
    siteId?: string
    title?: string
  }
  viewport?: string
}

/**
 * Builds TanStack Router `head()` `meta` + `links` entries for an admin page
 * from the resolved `AdminPageMetadata`, mirroring the tags Next.js renders
 * natively from the same `MetaConfig`.
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
  if (metadata.applicationName) {
    meta.push({ name: 'application-name', content: metadata.applicationName })
  }
  if (metadata.keywords) {
    meta.push({ name: 'keywords', content: metadata.keywords })
  }
  if (metadata.robots) {
    meta.push({ name: 'robots', content: metadata.robots })
  }
  if (metadata.googleBot) {
    meta.push({ name: 'googlebot', content: metadata.googleBot })
  }
  if (metadata.canonical) {
    links.push({ href: metadata.canonical, rel: 'canonical' })
  }
  for (const alternate of metadata.alternates ?? []) {
    links.push({
      href: alternate.url,
      rel: 'alternate',
      ...(alternate.hrefLang ? { hrefLang: alternate.hrefLang } : {}),
      ...(alternate.media ? { media: alternate.media } : {}),
      ...(alternate.title ? { title: alternate.title } : {}),
      ...(alternate.type ? { type: alternate.type } : {}),
    })
  }
  if (metadata.manifest) {
    links.push({ href: metadata.manifest, rel: 'manifest' })
  }

  const og = metadata.openGraph
  if (og) {
    if (og.title) {
      meta.push({ content: og.title, property: 'og:title' })
    }
    if (og.description) {
      meta.push({ content: og.description, property: 'og:description' })
    }
    if (og.url) {
      meta.push({ content: og.url, property: 'og:url' })
    }
    if (og.siteName) {
      meta.push({ content: og.siteName, property: 'og:site_name' })
    }
    if (og.locale) {
      meta.push({ content: og.locale, property: 'og:locale' })
    }
    if (og.type) {
      meta.push({ content: og.type, property: 'og:type' })
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
  }

  const twitter = metadata.twitter
  if (twitter) {
    if (twitter.card) {
      meta.push({ name: 'twitter:card', content: twitter.card })
    }
    if (twitter.site) {
      meta.push({ name: 'twitter:site', content: twitter.site })
    }
    if (twitter.siteId) {
      meta.push({ name: 'twitter:site:id', content: twitter.siteId })
    }
    if (twitter.creator) {
      meta.push({ name: 'twitter:creator', content: twitter.creator })
    }
    if (twitter.creatorId) {
      meta.push({ name: 'twitter:creator:id', content: twitter.creatorId })
    }
    if (twitter.title) {
      meta.push({ name: 'twitter:title', content: twitter.title })
    }
    if (twitter.description) {
      meta.push({ name: 'twitter:description', content: twitter.description })
    }
    for (const image of twitter.images ?? []) {
      meta.push({ name: 'twitter:image', content: image })
    }
  }

  for (const { name, content } of metadata.other ?? []) {
    meta.push({ name, content })
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

const isDefined = <T>(value: T | undefined): value is T => value !== undefined

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !(value instanceof URL)
    ? (value as Record<string, unknown>)
    : undefined

const asString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || value instanceof URL) {
    return String(value)
  }
  return undefined
}

const asList = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]

/** A metadata URL field may be a string, a `URL`, or a descriptor with a `url`. */
const asURL = (value: unknown): string | undefined =>
  asString(value) ?? asString(asRecord(value)?.url)

// Matches the directives Next.js serializes from an object-form `robots` value.
const robotsDirectives = [
  'noarchive',
  'nosnippet',
  'noimageindex',
  'nocache',
  'notranslate',
  'indexifembedded',
  'nositelinkssearchbox',
  'unavailable_after',
  'max-video-preview',
  'max-image-preview',
  'max-snippet',
] as const

const resolveRobots = (robots: unknown): string | undefined => {
  if (typeof robots === 'string') {
    return robots
  }

  const options = asRecord(robots)
  if (!options) {
    return undefined
  }

  const directives: string[] = []

  if (typeof options.index === 'boolean') {
    directives.push(options.index ? 'index' : 'noindex')
  }
  if (typeof options.follow === 'boolean') {
    directives.push(options.follow ? 'follow' : 'nofollow')
  }
  for (const directive of robotsDirectives) {
    const value = options[directive]
    if (value === true) {
      directives.push(directive)
    } else if (typeof value === 'string' || typeof value === 'number') {
      directives.push(`${directive}:${value}`)
    }
  }

  return directives.length ? directives.join(', ') : undefined
}

const toIcon = (icon: unknown, rel: string): AdminPageIcon | undefined => {
  const url = asURL(icon)
  if (!url) {
    return undefined
  }

  const descriptor = asRecord(icon)

  return {
    type: asString(descriptor?.type),
    media: asString(descriptor?.media),
    rel: asString(descriptor?.rel) ?? rel,
    sizes: asString(descriptor?.sizes),
    url,
  }
}

const toIcons = (icons: unknown, rel: string): AdminPageIcon[] =>
  asList(icons)
    .map((icon) => toIcon(icon, rel))
    .filter(isDefined)

/** `icons` is a URL, a descriptor, a list of either, or an object keyed by icon kind. */
const resolveIcons = (icons: unknown): AdminPageIcon[] => {
  const byKind = asRecord(icons)

  if (!byKind || Array.isArray(icons) || 'url' in byKind) {
    return toIcons(icons, 'icon')
  }

  return [
    ...toIcons(byKind.shortcut, 'shortcut icon'),
    ...toIcons(byKind.icon, 'icon'),
    ...toIcons(byKind.apple, 'apple-touch-icon'),
    ...toIcons(byKind.other, 'icon'),
  ]
}

/**
 * Flattens the framework-agnostic `MetaConfig` (Next.js `Metadata` shape) into
 * the plain, serializable `AdminPageMetadata` the route loader ships to the
 * client. The full `MetaConfig` carries a `URL` `metadataBase`, functions and
 * other non-serializable values that seroval cannot cross the wire, so only the
 * fields `getAdminMeta` renders are extracted.
 */
export const toAdminPageMetadata = (meta: MetaConfig): AdminPageMetadata => {
  // Next.js resolves relative URL fields against `metadataBase`. Crawlers ignore relative
  // `og:image` and canonical URLs, so do the same here.
  const metadataBase = meta.metadataBase ? String(meta.metadataBase) : undefined
  const toAbsoluteURL = (url: string): string => {
    if (!metadataBase || !URL.canParse(url, metadataBase)) {
      return url
    }
    return new URL(url, metadataBase).toString()
  }

  const og = asRecord(meta.openGraph)
  const images: AdminPageOGImage[] = asList(og?.images)
    .map((image) => {
      const url = asURL(image)
      if (!url) {
        return undefined
      }
      const descriptor = asRecord(image)
      return {
        alt: asString(descriptor?.alt),
        height: typeof descriptor?.height === 'number' ? descriptor.height : undefined,
        url: toAbsoluteURL(url),
        width: typeof descriptor?.width === 'number' ? descriptor.width : undefined,
      }
    })
    .filter(isDefined)

  const ogTitle = asString(og?.title)
  const ogDescription = asString(og?.description)
  const ogURL = asURL(og?.url)

  // Like Next.js, Twitter tags inherit the title, description and images from Open Graph.
  const twitter = asRecord(meta.twitter)
  const twitterImages = twitter?.images
    ? asList(twitter.images).map(asURL).filter(isDefined).map(toAbsoluteURL)
    : images.map((image) => image.url)

  const alternates = asRecord(meta.alternates)
  const alternateLinks: AdminPageAlternate[] = [
    ...Object.entries(asRecord(alternates?.languages) ?? {}).flatMap(([hrefLang, value]) =>
      asList(value).map((alternate) => ({ alternate, hrefLang })),
    ),
    ...Object.entries(asRecord(alternates?.media) ?? {}).flatMap(([media, value]) =>
      asList(value).map((alternate) => ({ alternate, media })),
    ),
    ...Object.entries(asRecord(alternates?.types) ?? {}).flatMap(([type, value]) =>
      asList(value).map((alternate) => ({ type, alternate })),
    ),
  ]
    .map(({ alternate, ...attributes }) => {
      const url = asURL(alternate)
      return url
        ? {
            ...attributes,
            title: asString(asRecord(alternate)?.title),
            url: toAbsoluteURL(url),
          }
        : undefined
    })
    .filter(isDefined)

  const canonical = asURL(alternates?.canonical)
  const manifest = asURL(meta.manifest)
  const keywords = meta.keywords
  const icons = resolveIcons(meta.icons)

  const other = Object.entries(asRecord(meta.other) ?? {}).flatMap(([name, value]) =>
    asList(value)
      .map(asString)
      .filter(isDefined)
      .map((content) => ({ name, content })),
  )

  return {
    alternates: alternateLinks.length ? alternateLinks : undefined,
    applicationName: asString(meta.applicationName),
    canonical: canonical ? toAbsoluteURL(canonical) : undefined,
    description: typeof meta.description === 'string' ? meta.description : undefined,
    googleBot: resolveRobots(asRecord(meta.robots)?.googleBot),
    icons: icons.length ? icons : undefined,
    keywords:
      typeof keywords === 'string'
        ? keywords
        : Array.isArray(keywords)
          ? keywords.join(', ')
          : undefined,
    manifest: manifest ? toAbsoluteURL(manifest) : undefined,
    openGraph: og
      ? {
          type: asString(og.type),
          description: ogDescription,
          images: images.length ? images : undefined,
          locale: asString(og.locale),
          siteName: asString(og.siteName),
          title: ogTitle,
          url: ogURL ? toAbsoluteURL(ogURL) : undefined,
        }
      : undefined,
    other: other.length ? other : undefined,
    robots: resolveRobots(meta.robots),
    title: resolveTitle(meta.title),
    twitter:
      og || twitter
        ? {
            card:
              asString(twitter?.card) ?? (twitterImages.length ? 'summary_large_image' : 'summary'),
            creator: asString(twitter?.creator),
            creatorId: asString(twitter?.creatorId),
            description: asString(twitter?.description) ?? ogDescription,
            images: twitterImages.length ? twitterImages : undefined,
            site: asString(twitter?.site),
            siteId: asString(twitter?.siteId),
            title: asString(twitter?.title) ?? ogTitle,
          }
        : undefined,
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
