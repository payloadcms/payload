/**
 * Copies the Vigor website's content into the CMS (everything under "Vigor website"), in every
 * language and with its images, and publishes it.
 *
 *   pnpm payload run scripts/import-vigor.ts <website-url> --dry-run     # only show what would happen
 *   pnpm payload run scripts/import-vigor.ts <website-url>               # import
 *   pnpm payload run scripts/import-vigor.ts <website-url> --no-images   # import without images
 *
 * On the server, deploy/import-vigor.sh runs this inside Docker (README: "Vigor website").
 *
 * The content comes from `GET <website-url>/api/content/<language>`, so run it while the website
 * still uses its own content files, before it is pointed at the CMS. Texts without a translation are
 * left empty in that language, so the website shows the English text, also after it's edited.
 *
 * Products, service pages and news that already exist (same slug), events with the same English
 * title and day, and pages (globals) that already have content are skipped, so running it again
 * is safe and keeps your edits.
 */
/* eslint-disable no-console -- a command-line script */
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { FlattenedField, TypedLocale, Where } from 'payload'

import { getPayload } from 'payload'

import config from '../src/payload.config'

type Data = Record<string, unknown>

/** The website's content in one language (Site in server/src/content.ts of the website repo) */
type Site = {
  about: {
    body: string[]
    image: string
    milestones: { text: string; year: string }[]
    summary: string
    teams: { name: string; text: string }[]
    title: string
    values: { text: string; title: string }[]
  }
  company: {
    address: string
    email: string
    hours: string
    name: string
    phone: string
    portalName: string
    shortName: string
    social: { facebook: string; instagram: string; linkedin: string }
    tagline: string
  }
  events: { date: string; location: string; title: string }[]
  hero: {
    cta: { label: string; to: string }
    image: string
    kicker: string
    summary: string
    title: string
  }[]
  nav: { label: string; to: string }[]
  news: {
    body: string[]
    category: string
    date: string
    image: string
    slug: string
    summary: string
    title: string
  }[]
  products: {
    badge?: string
    body: string[]
    category: string
    image?: string
    metal: string
    moq: number
    name: string
    sku: string
    slug: string
    stone: string
    summary: string
    unit: string
    weight: string
  }[]
  stats: { label: string; value: string }[]
  topics: { body: string[]; image: string; slug: string; summary: string; title: string }[]
}

type VigorCollection = 'vigor-events' | 'vigor-news' | 'vigor-products' | 'vigor-services'
type VigorGlobal = 'vigor-about' | 'vigor-home' | 'vigor-settings'

/** An image to import, named after what it shows */
type Image = { alt: string; name: string; url: string }

const OPTIONS = ['--dry-run', '--no-images']

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const withImages = !args.includes('--no-images')
const websiteURL = args.find((arg) => !arg.startsWith('-'))?.replace(/\/+$/, '')
// A mistyped --dry-run must not run a real import
const unknownOptions = args.filter((arg) => arg.startsWith('-') && !OPTIONS.includes(arg))

if (unknownOptions.length) {
  console.error(`Unknown option: ${unknownOptions.join(' ')}`)
}

if (unknownOptions.length || !websiteURL || !/^https?:\/\/[^/\s]+$/.test(websiteURL)) {
  console.error(
    'Usage: pnpm payload run scripts/import-vigor.ts <website-url> [--dry-run] [--no-images]',
  )
  console.error('  e.g. pnpm payload run scripts/import-vigor.ts https://www.example.com --dry-run')
  process.exit(1)
}

const { content } = await getJSON<{ content?: string }>('/api/health')

if (content !== 'files') {
  console.error(
    content === 'payload'
      ? `${websiteURL} already shows content from a CMS. Import while the website still uses its own files (PAYLOAD_URL not set).`
      : `${websiteURL} can't export its content yet. Deploy the latest version of the website first.`,
  )
  process.exit(1)
}

const payload = await getPayload({ config })

// On a new database, MongoDB is still creating collections and indexes in the background, and a
// write in a transaction meanwhile fails with "Transaction ... has been aborted". An index that
// can't be built, e.g. because an older one with the same name exists, doesn't stop the import.
const models = Object.values((payload.db as MongooseAdapter).connection.models)
const indexBuilds = await Promise.allSettled(models.map((model) => model.init()))

indexBuilds.forEach((result, index) => {
  if (result.status === 'rejected') {
    console.warn(
      `Warning: MongoDB couldn't build an index in "${models[index]!.collection.name}" (README: "Troubleshooting"): ${result.reason instanceof Error ? result.reason.message : String(result.reason)}\n`,
    )
  }
})

const localization = payload.config.localization

if (!localization) {
  console.error('Localization is off in src/payload.config.ts.')
  process.exit(1)
}

const defaultLocale = localization.defaultLocale as TypedLocale
const sites: Partial<Record<TypedLocale, Site>> = {}

for (const code of localization.localeCodes as TypedLocale[]) {
  const site = await getJSON<Site>(`/api/content/${code}`, { optional: code !== defaultLocale })

  if (site) {
    sites[code] = site
  } else {
    console.warn(`The website has no ${code} version, so nothing is imported in ${code}.\n`)
  }
}

const english = sites[defaultLocale]!
const otherLocales = (Object.keys(sites) as TypedLocale[]).filter((code) => code !== defaultLocale)
// Imports run without telling the website, which doesn't read from the CMS yet
const context = { disableRevalidate: true }
const images = new Map<string, string | undefined>()
let added = 0
let skipped = 0

if (dryRun) {
  console.log('Dry run: nothing is saved.\n')
}

await importGlobal({
  slug: 'vigor-settings',
  hasContent: (doc) => Boolean((doc.company as Data | undefined)?.name),
  label: 'Site settings',
  toData: (site) => ({
    company: site.company,
    nav: site.nav.map(({ label, to }) => ({ label, link: to })),
    stats: site.stats,
  }),
})

await importGlobal({
  slug: 'vigor-home',
  hasContent: (doc) => Boolean((doc.hero as Data[] | undefined)?.length),
  images: (site) => ({
    hero: site.hero.map(({ image, title }, index) =>
      imageOf(image, { alt: title, name: `vigor-hero-${index + 1}` }),
    ),
  }),
  label: 'Home page',
  toData: (site) => ({
    hero: site.hero.map(({ cta, kicker, summary, title }) => ({
      ctaLabel: cta.label,
      ctaLink: cta.to,
      kicker,
      summary,
      title,
    })),
  }),
})

await importGlobal({
  slug: 'vigor-about',
  hasContent: (doc) => Boolean(doc.title),
  images: (site) => ({
    image: imageOf(site.about.image, { alt: site.about.title, name: 'vigor-about' }),
  }),
  label: 'About page',
  toData: ({ about }) => ({
    body: paragraphs(about.body),
    milestones: about.milestones,
    summary: about.summary,
    teams: about.teams,
    title: about.title,
    values: about.values,
  }),
})

await importDocs({
  collection: 'vigor-products',
  existing: ({ sku, slug }): Where => ({
    or: [{ slug: { equals: slug } }, { sku: { equals: sku } }],
  }),
  image: ({ image, name, slug }) => imageOf(image, { alt: name, name: `vigor-product-${slug}` }),
  items: english.products,
  label: 'Product',
  title: ({ name }) => name,
  toData: (
    { badge, body, category, metal, moq, name, sku, slug, stone, summary, unit, weight },
    index,
  ) => ({
    badge: badge || undefined,
    body: paragraphs(body),
    category,
    metal,
    moq,
    name,
    sku,
    slug,
    sortOrder: (index + 1) * 10,
    stone,
    summary,
    unit,
    weight,
  }),
  translated: (site, { slug }) => site.products.find((product) => product.slug === slug),
})

await importDocs({
  collection: 'vigor-services',
  existing: ({ slug }) => ({ slug: { equals: slug } }),
  image: ({ image, slug, title }) => imageOf(image, { alt: title, name: `vigor-service-${slug}` }),
  items: english.topics,
  label: 'Service page',
  title: ({ title }) => title,
  toData: ({ body, slug, summary, title }, index) => ({
    body: paragraphs(body),
    slug,
    sortOrder: (index + 1) * 10,
    summary,
    title,
  }),
  translated: (site, { slug }) => site.topics.find((topic) => topic.slug === slug),
})

await importDocs({
  collection: 'vigor-news',
  existing: ({ slug }) => ({ slug: { equals: slug } }),
  image: ({ image, slug, title }) => imageOf(image, { alt: title, name: `vigor-news-${slug}` }),
  items: english.news,
  label: 'News',
  title: ({ title }) => title,
  toData: ({ body, category, date, slug, summary, title }) => ({
    body: paragraphs(body),
    category,
    date: day(date),
    slug,
    summary,
    title,
  }),
  translated: (site, { slug }) => site.news.find((article) => article.slug === slug),
})

await importDocs({
  collection: 'vigor-events',
  existing: ({ date, title }): Where => ({
    and: [
      { title: { equals: title } },
      { date: { greater_than_equal: `${date}T00:00:00.000Z` } },
      { date: { less_than_equal: `${date}T23:59:59.999Z` } },
    ],
  }),
  items: english.events,
  label: 'Event',
  title: ({ date, title }) => `${date}  ${title}`,
  toData: ({ date, location, title }) => ({ date: day(date), location, title }),
  // Lists other than products, service pages and news are translated by position
  translated: (site, _event, index) => site.events[index],
})

const imageCount = dryRun ? images.size : [...images.values()].filter(Boolean).length

console.log(
  `\n${dryRun ? 'Would add' : 'Added'} ${added} items with ${imageCount} images, skipped ${skipped} that already exist.`,
)
process.exit(0)

/** Products, service pages, news or events: each English item, then its translations */
async function importDocs<T>({
  collection,
  existing,
  image,
  items,
  label,
  title,
  toData,
  translated,
}: {
  collection: VigorCollection
  existing: (item: T) => Where
  image?: (item: T) => Image | undefined
  items: T[]
  label: string
  title: (item: T) => string
  toData: (item: T, index: number) => Data
  /** The same item in another language's content */
  translated: (site: Site, item: T, index: number) => T | undefined
}) {
  const { flattenedFields } = payload.collections[collection].config

  for (const [index, item] of items.entries()) {
    const { docs } = await payload.find({
      collection,
      depth: 0,
      limit: 1,
      locale: defaultLocale,
      overrideAccess: true,
      pagination: false,
      where: existing(item),
    })

    if (docs[0]) {
      skipped++
      console.log(`  skip  ${label}: ${title(item)}  [already exists]`)
      continue
    }

    const data = toData(item, index)
    const translations = translationsOf(data, (code) => {
      const other = translated(sites[code]!, item, index)
      return other && toData(other, index)
    })
    const imageToImport = image?.(item)

    added++
    console.log(
      `  ${dryRun ? 'new ' : 'added'}  ${label}: ${title(item)}${describe({ images: [imageToImport], translations })}`,
    )

    if (dryRun) {
      countImages([imageToImport])
      continue
    }

    const imageID = await importImage(imageToImport)
    const doc = await payload.create({
      collection,
      context,
      data: { ...data, ...(imageID ? { image: imageID } : {}), _status: 'published' } as never,
      locale: defaultLocale,
      overrideAccess: true,
      // Live in every language, in English where it isn't translated
      publishAllLocales: true,
    })

    for (const [code, translation] of translations) {
      await payload.update({
        id: doc.id,
        collection,
        context,
        data: {
          ...translate(flattenedFields, {}, data, translation),
          _status: 'published',
        } as never,
        locale: code,
        overrideAccess: true,
      })
    }
  }
}

/** Site settings, home page or About page: English first, then each translation */
async function importGlobal({
  slug,
  hasContent,
  images: imagesOf,
  label,
  toData,
}: {
  hasContent: (doc: Data) => boolean
  /** Upload fields, in the same shape as the data */
  images?: (site: Site) => Data
  label: string
  slug: VigorGlobal
  toData: (site: Site) => Data
}) {
  const current = asData(
    await payload.findGlobal({ slug, depth: 0, locale: defaultLocale, overrideAccess: true }),
  )

  if (hasContent(current)) {
    skipped++
    console.log(`  skip  ${label}  [already has content]`)
    return
  }

  const { flattenedFields } = payload.globals.config.find((global) => global.slug === slug)!
  const data = toData(english)
  const translations = translationsOf(data, (code) => toData(sites[code]!))
  const imagesToImport = imagesOf?.(english) ?? {}
  const imageList = Object.values(imagesToImport).flat() as (Image | undefined)[]

  added++
  console.log(
    `  ${dryRun ? 'new ' : 'added'}  ${label}${describe({ images: imageList, translations })}`,
  )

  if (dryRun) {
    countImages(imageList)
    return
  }

  await payload.updateGlobal({
    slug,
    context,
    data: addImages(data, await importImages(imagesToImport)) as never,
    depth: 0,
    locale: defaultLocale,
    overrideAccess: true,
  })

  for (const [code, translation] of translations) {
    // Array rows are shared by all languages: send them as saved, with their ids and translations
    const saved = asData(
      await payload.findGlobal({
        slug,
        depth: 0,
        fallbackLocale: false,
        locale: code,
        overrideAccess: true,
      }),
    )

    await payload.updateGlobal({
      slug,
      context,
      data: translate(flattenedFields, saved, data, translation) as never,
      locale: code,
      overrideAccess: true,
    })
  }
}

/** The languages in which the item has any translated text, with that language's data */
function translationsOf(english: Data, dataIn: (code: TypedLocale) => Data | undefined) {
  return otherLocales.flatMap((code) => {
    const data = dataIn(code)
    return data && JSON.stringify(data) !== JSON.stringify(english) ? [[code, data] as const] : []
  })
}

/**
 * What to save in another language: the translated texts, and an empty text where the translation
 * is the same as the English one, so that it keeps showing the English text after it's edited.
 * Arrays and groups aren't localized themselves, so array rows keep their saved values and ids.
 */
function translate(fields: FlattenedField[], saved: Data, english: Data, other: Data): Data {
  const result: Data = {}

  for (const field of fields) {
    const value = other[field.name]

    if (field.localized) {
      result[field.name] = typeof value === 'string' && value !== english[field.name] ? value : ''
    } else if (field.type === 'array' && Array.isArray(saved[field.name])) {
      const englishRows = (english[field.name] ?? []) as Data[]
      const otherRows = (value ?? []) as Data[]

      result[field.name] = (saved[field.name] as Data[]).map((row, index) => ({
        ...row,
        ...translate(field.flattenedFields, row, englishRows[index] ?? {}, otherRows[index] ?? {}),
      }))
    } else if (field.type === 'group') {
      result[field.name] = translate(
        field.flattenedFields,
        (saved[field.name] ?? {}) as Data,
        (english[field.name] ?? {}) as Data,
        (value ?? {}) as Data,
      )
    }
  }

  return result
}

/** Downloads an image and saves it in Media. Returns its ID, or nothing if it can't be loaded. */
async function importImage(image: Image | undefined) {
  if (!image) {
    return undefined
  }
  if (images.has(image.url)) {
    return images.get(image.url)
  }

  let id: string | undefined

  try {
    const res = await fetch(new URL(image.url, websiteURL), { signal: AbortSignal.timeout(60_000) })
    const mimetype = res.headers.get('content-type')?.split(';')[0]?.trim() ?? ''

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`)
    }
    if (!mimetype.startsWith('image/')) {
      throw new Error(`not an image (${mimetype || 'no content type'})`)
    }

    const data = Buffer.from(await res.arrayBuffer())
    const extension = mimetype.slice('image/'.length).replace('jpeg', 'jpg').replace(/\+.*/, '')
    const media = await payload.create({
      collection: 'media',
      context,
      data: { alt: image.alt },
      file: { name: `${image.name}.${extension}`, data, mimetype, size: data.length },
      overrideAccess: true,
    })

    id = String(media.id)
  } catch (err) {
    console.warn(
      `        could not import the image ${image.url}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  images.set(image.url, id)
  return id
}

/** importImage for each image in `shape`, keeping its shape: { image } or { hero: [...] } */
async function importImages(shape: Data) {
  const result: Data = {}

  for (const [key, value] of Object.entries(shape)) {
    result[key] = Array.isArray(value)
      ? await Promise.all(value.map((image: Image | undefined) => importImage(image)))
      : await importImage(value as Image | undefined)
  }

  return result
}

/** Adds the imported image IDs to the data: `image` on the global, or `image` on each array row */
function addImages(data: Data, imageIDs: Data): Data {
  const result = { ...data }

  for (const [key, value] of Object.entries(imageIDs)) {
    if (Array.isArray(value)) {
      result[key] = (result[key] as Data[]).map((row, index) =>
        value[index] ? { ...row, image: value[index] } : row,
      )
    } else if (value) {
      result[key] = value
    }
  }

  return result
}

function imageOf(url: string | undefined, { alt, name }: Omit<Image, 'url'>): Image | undefined {
  return url && withImages ? { name, alt, url } : undefined
}

function countImages(list: (Image | undefined)[]) {
  for (const image of list) {
    if (image) {
      images.set(image.url, undefined)
    }
  }
}

function describe({
  images: list,
  translations,
}: {
  images: (Image | undefined)[]
  translations: ReturnType<typeof translationsOf>
}) {
  const imageCount = list.filter(Boolean).length
  const languages = translations.map(([code]) => code)
  const parts = [
    imageCount ? `${imageCount} image${imageCount === 1 ? '' : 's'}` : '',
    languages.length ? `translated: ${languages.join(', ')}` : '',
  ].filter(Boolean)

  return parts.length ? `  (${parts.join('; ')})` : ''
}

/** A document as plain data, for the code above that works on any global's fields */
function asData(doc: object) {
  return doc as Data
}

/** The website's paragraphs as one text, separated by blank lines */
function paragraphs(list: string[]) {
  return list.join('\n\n')
}

/** Noon UTC on that day, like the admin panel saves a date without a time */
function day(date: string) {
  return `${date.slice(0, 10)}T12:00:00.000Z`
}

async function getJSON<T>(pathname: string, { optional = false } = {}): Promise<T> {
  const res = await fetch(`${websiteURL}${pathname}`, { signal: AbortSignal.timeout(30_000) })

  if (optional && res.status === 404) {
    return undefined as T
  }
  if (!res.ok) {
    throw new Error(`GET ${websiteURL}${pathname} returned ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}
