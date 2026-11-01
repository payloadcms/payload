/**
 * Fills the Vigor website's VgemsAI app page (Vigor website → VgemsAI app page, /vgemsai on the
 * website) with its first version, in every language, with the banner artwork
 * (README: "VgemsAI app page").
 *
 *   pnpm payload run scripts/import-app-page.ts --dry-run   # only show what would happen
 *   pnpm payload run scripts/import-app-page.ts             # import
 *   pnpm payload run scripts/import-app-page.ts --update    # replace the page's text, also once it has some
 *
 * On the server, deploy/import-app-page.sh runs this inside Docker.
 *
 * The texts are in scripts/app-page/content.json, one entry per language, and the banner is
 * scripts/app-page/banner.jpg. They're only the first version: from then on, the page is edited in
 * the admin panel. A page that already has a title is skipped, so running it again keeps your edits.
 * Saving the page puts it live on the website.
 */
/* eslint-disable no-console -- a command-line script */
import type { FlattenedField, TypedLocale } from 'payload'

import { readFile } from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

import config from '../src/payload.config'

type Data = Record<string, unknown>

const OPTIONS = ['--dry-run', '--update']
const SLUG = 'vigor-app'
const CONTENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'app-page')
const BANNER = { name: 'vgemsai-banner.jpg', alt: 'Gemstones around a large emerald on a green background' }

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const update = args.includes('--update')
// A mistyped --dry-run must not run a real import
const unknownArgs = args.filter((arg) => !OPTIONS.includes(arg))

if (unknownArgs.length) {
  console.error(`Unknown option: ${unknownArgs.join(' ')}`)
  console.error('Usage: pnpm payload run scripts/import-app-page.ts [--dry-run] [--update]')
  process.exit(1)
}

const payload = await getPayload({ config })
const { localization } = payload.config
const defaultLocale = (localization ? localization.defaultLocale : 'en') as TypedLocale
const content = JSON.parse(await readFile(path.join(CONTENT_DIR, 'content.json'), 'utf8')) as Record<
  string,
  Data
>
const english = content[defaultLocale]!
const translations = Object.entries(content).filter(([code]) => code !== defaultLocale)

const current = asData(
  await payload.findGlobal({ slug: SLUG, depth: 0, locale: defaultLocale, overrideAccess: true }),
)

if (dryRun) {
  console.log('Dry run: nothing is saved.\n')
}

if (current.title && !update) {
  console.log('  skip  VgemsAI app page  [already has content; --update replaces its text]')
  process.exit(0)
}

console.log(
  `  ${current.title ? 'update' : 'add'}  VgemsAI app page  (translated: ${translations.map(([code]) => code).join(', ')})`,
)

if (dryRun) {
  process.exit(0)
}

const image = current.image ?? (await uploadBanner())

await payload.updateGlobal({
  slug: SLUG,
  data: { ...english, image } as never,
  depth: 0,
  locale: defaultLocale,
  overrideAccess: true,
})

const { flattenedFields } = payload.globals.config.find((global) => global.slug === SLUG)!

for (const [code, translation] of translations) {
  // Array rows are shared by all languages: send them as saved, with their ids and translations
  const saved = asData(
    await payload.findGlobal({
      slug: SLUG,
      depth: 0,
      fallbackLocale: false,
      locale: code as TypedLocale,
      overrideAccess: true,
    }),
  )

  await payload.updateGlobal({
    slug: SLUG,
    data: translate(flattenedFields, saved, english, translation) as never,
    locale: code as TypedLocale,
    overrideAccess: true,
  })
}

console.log(
  '\nDone. The page is live at /vgemsai on the Vigor website. Edit it under Vigor website → VgemsAI app page.',
)
process.exit(0)

/** A document as plain data, for the code that works on any of the page's fields */
function asData(doc: object) {
  return doc as Data
}

async function uploadBanner() {
  const data = await readFile(path.join(CONTENT_DIR, 'banner.jpg'))
  const media = await payload.create({
    collection: 'media',
    data: { alt: BANNER.alt },
    file: { name: BANNER.name, data, mimetype: 'image/jpeg', size: data.length },
    overrideAccess: true,
  })

  return media.id
}

/**
 * A language's data for `updateGlobal`: its texts, with array rows as saved (same ids). A text the
 * same as in English is left empty, so the website shows the English one, also after it's edited.
 */
function translate(fields: FlattenedField[], saved: Data, englishData: Data, other: Data): Data {
  const result: Data = {}

  for (const field of fields) {
    if (!('name' in field)) {
      continue
    }

    const value = other[field.name]

    if (field.localized) {
      result[field.name] = typeof value === 'string' && value !== englishData[field.name] ? value : ''
    } else if (field.type === 'array' && Array.isArray(saved[field.name])) {
      const englishRows = (englishData[field.name] ?? []) as Data[]
      const otherRows = (value ?? []) as Data[]

      result[field.name] = (saved[field.name] as Data[]).map((row, index) => ({
        ...row,
        ...translate(field.flattenedFields, row, englishRows[index] ?? {}, otherRows[index] ?? {}),
      }))
    } else if (field.type === 'group' || field.type === 'tab') {
      result[field.name] = translate(
        field.flattenedFields,
        (saved[field.name] ?? {}) as Data,
        (englishData[field.name] ?? {}) as Data,
        (value ?? {}) as Data,
      )
    }
  }

  return result
}
