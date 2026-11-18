/**
 * Publishes the products imported from the old website (scripts/import-legacy-catalog.ts) in every
 * language at once, e.g. all of those that have a photo (README: "Products from the old website").
 *
 *   pnpm payload run scripts/publish-legacy-products.ts --with-photo --dry-run   # only show what would happen
 *   pnpm payload run scripts/publish-legacy-products.ts --with-photo             # publish
 *
 * Options:
 *   --with-photo          only products that have a photo
 *   --hint=likely,check   only products with these "Old website: hint" values
 *   --dry-run             only show what would happen
 *
 * Unlike Publish in the admin panel's list, which publishes the language you're viewing only, this
 * publishes every language (in English where a text isn't translated). It takes every imported
 * product that isn't published in all languages yet, or has unpublished changes. A product with a
 * required field still empty (gemstones, metal, category…) isn't published: the list at the end says
 * which field to fill in.
 *
 * On the server, deploy/publish-legacy-products.sh runs this inside Docker.
 */
/* eslint-disable no-console -- a command-line script */
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { TypedLocale, Where } from 'payload'

import { getPayload } from 'payload'

import type { VigorProduct } from '../src/payload-types'

import config from '../src/payload.config'

const HINTS = ['likely', 'check', 'old', 'doubtful']
const FLAGS = ['--dry-run', '--with-photo']

/** Fields a product needs before it can be published, with their names in the admin panel */
const REQUIRED: { field: keyof VigorProduct; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'category', label: 'Category' },
  { field: 'stones', label: 'Gemstones' },
  { field: 'metal', label: 'Metal' },
  { field: 'moq', label: 'Minimum order' },
  { field: 'unit', label: 'Unit' },
  { field: 'summary', label: 'Summary' },
]

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const withPhoto = args.includes('--with-photo')
const hints = args
  .find((arg) => arg.startsWith('--hint='))
  ?.slice('--hint='.length)
  .split(',')
  .map((hint) => hint.trim().toLowerCase())
// A mistyped --dry-run must not publish anything
const unknownOptions = args.filter((arg) => !FLAGS.includes(arg) && !arg.startsWith('--hint='))
const unknownHints = (hints ?? []).filter((hint) => !HINTS.includes(hint))

if (unknownOptions.length || unknownHints.length) {
  if (unknownOptions.length) {
    console.error(`Unknown option: ${unknownOptions.join(' ')}`)
  }
  if (unknownHints.length) {
    console.error(`Unknown hint: ${unknownHints.join(', ')} (use ${HINTS.join(', ')})`)
  }
  console.error(
    'Usage: pnpm payload run scripts/publish-legacy-products.ts [--with-photo] [--hint=likely,check] [--dry-run]',
  )
  process.exit(1)
}

const payload = await getPayload({ config })
const models = Object.values((payload.db as MongooseAdapter).connection.models)
await Promise.allSettled(models.map((model) => model.init()))

const localization = payload.config.localization || undefined
const defaultLocale = (localization?.defaultLocale ?? 'en') as TypedLocale
const localeCodes = (localization?.localeCodes ?? [defaultLocale]) as TypedLocale[]
// One refresh of the website at the end instead of one per product
const context = { disableRevalidate: true }

const where: Where = {
  and: [
    { legacyCode: { exists: true } },
    ...(withPhoto ? [{ image: { exists: true } }] : []),
    ...(hints ? [{ legacyHint: { in: hints } }] : []),
  ],
}

// Which languages each product still has to be published in. The status is kept per language, and
// the latest version (a draft with unpublished changes) counts as not published.
const pending = new Map<string, { doc: VigorProduct; locales: TypedLocale[] }>()
for (const locale of localeCodes) {
  const { docs } = await payload.find({
    collection: 'vigor-products',
    depth: 0,
    draft: true,
    locale,
    overrideAccess: true,
    pagination: false,
    sort: 'sortOrder',
    where: { and: [where, { _status: { not_equals: 'published' } }] },
  })
  for (const doc of docs) {
    const entry = pending.get(String(doc.id)) ?? {
      doc: locale === defaultLocale ? doc : (undefined as unknown as VigorProduct),
      locales: [],
    }
    entry.locales.push(locale)
    pending.set(String(doc.id), entry)
  }
}

if (dryRun) {
  console.log('Dry run: nothing is published.\n')
}

const published: string[] = []
const incomplete: string[] = []

for (const [id, entry] of pending) {
  // The English version, with every field, to check what's missing
  const doc =
    entry.doc ??
    (await payload.findByID({
      id,
      collection: 'vigor-products',
      depth: 0,
      draft: true,
      locale: defaultLocale,
      overrideAccess: true,
    }))
  const label = `${String(doc.sku).padEnd(8)} ${doc.name}`
  const missing = REQUIRED.filter(({ field }) => isEmpty(doc[field])).map((required) => required.label)
  const languages = entry.locales.length === localeCodes.length ? 'all languages' : entry.locales.join(', ')

  if (missing.length) {
    incomplete.push(`  ${label}  [fill in: ${missing.join(', ')}]`)
    continue
  }

  if (!dryRun) {
    try {
      await payload.update({
        id,
        collection: 'vigor-products',
        context,
        data: { _status: 'published' },
        draft: false,
        locale: defaultLocale,
        overrideAccess: true,
        // Every language, in English where a text isn't translated
        publishAllLocales: true,
      })
    } catch (err) {
      incomplete.push(`  ${label}  [${errorText(err)}]`)
      continue
    }
  }
  published.push(label)
  console.log(`  ${dryRun ? 'publish  ' : 'published'}  ${label}  (${languages})`)
}

if (incomplete.length) {
  console.log(
    `\nNot ${dryRun ? 'publishable' : 'published'} yet, ${incomplete.length} products: fill in these fields in the admin panel, then run this again.`,
  )
  console.log(incomplete.join('\n'))
}

console.log(
  `\n${dryRun ? 'Would publish' : 'Published'} ${published.length} products in every language${incomplete.length ? `; ${incomplete.length} need fields filled in first` : ''}.`,
)

if (!dryRun && published.length) {
  await refreshWebsite()
}
process.exit(0)

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)
}

/** Payload's validation message, e.g. "The following field is invalid: Metal" */
function errorText(err: unknown) {
  const errors = (err as { data?: { errors?: { label?: string; path?: string }[] } })?.data?.errors
  if (errors?.length) {
    return `fill in: ${errors.map((error) => error.label ?? error.path).join(', ')}`
  }
  return err instanceof Error ? err.message : String(err)
}

/** Asks the website to reload its content now (see src/vigor/revalidate.ts), when it's configured */
async function refreshWebsite() {
  const websiteURL = process.env.VIGOR_WEBSITE_URL?.replace(/\/+$/, '')
  const secret = process.env.VIGOR_WEBSITE_REVALIDATE_SECRET

  if (!websiteURL || !secret) {
    console.log('The website shows them within a minute.')
    return
  }

  try {
    const res = await fetch(`${websiteURL}/api/revalidate`, {
      headers: { Authorization: `Bearer ${secret}` },
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    })
    console.log(
      res.ok
        ? 'Refreshed the website.'
        : `Could not refresh the website (${res.status}): it shows them within a minute.`,
    )
  } catch (err) {
    console.log(
      `Could not refresh the website (${err instanceof Error ? err.message : String(err)}): it shows them within a minute.`,
    )
  }
}
