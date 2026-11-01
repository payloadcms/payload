/**
 * Copies the old Vigor website's products into the CMS as drafts, with their best photo, so they can
 * be checked in the admin panel and published one by one (README: "Products from the old website").
 *
 *   pnpm payload run scripts/import-legacy-catalog.ts <old_vgems folder> --dry-run   # only show what would happen
 *   pnpm payload run scripts/import-legacy-catalog.ts <old_vgems folder>             # import
 *
 * Options:
 *   --only-legit          only products marked "legit": true in the catalog file
 *   --hint=likely,check   only products with these hints (likely, check, old, doubtful)
 *   --no-images           without photos
 *   --catalog=<file>      a catalog file in the folder other than export/legacy-catalog.json,
 *                         e.g. a reviewed copy
 *
 * The folder is a checkout of atorpos/old_vgems with export/legacy-catalog.json (made by its
 * export/build_catalog.py) and the photos it points to. On the server, deploy/import-legacy-catalog.sh
 * runs this inside Docker.
 *
 * Each old style code (BL404, CB001…) becomes one product, saved as a draft: the website doesn't
 * show it until it's published. What the old records say about it, and what the import had to
 * guess, is in its "Old website" fields. Products marked "legit": false are never imported, and a
 * product whose old code is already in the CMS is skipped, so running it again is safe and keeps
 * your edits.
 */
/* eslint-disable no-console -- a command-line script */
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { TypedLocale } from 'payload'

import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import { slugify } from 'payload/shared'

import config from '../src/payload.config'
import { gemstones, metals, productCategories, units } from '../src/vigor/options'

type Photo = { date?: string; from: string; match?: string; path: string; px?: string }

type Variant = {
  oldPriceUsd?: Record<string, string>
  photos?: Photo[]
  seenIn?: string[]
  sizes?: string[]
  skus?: string[]
  specs?: Record<string, string>
  stone?: string
  stoneName?: string
}

/** One product of export/legacy-catalog.json in atorpos/old_vgems */
type LegacyProduct = {
  catalogText?: { page: number; pdf: string; text: null | string; year: null | number }[]
  category: null | string
  categorySource?: string
  code: string
  description?: string
  hint: string
  hintReasons: string[]
  lastSeen: null | number
  legit: boolean | null
  name: null | string
  otherNames?: string[]
  photo: null | string
  reviewNote?: string
  seenIn: string[]
  specs?: { availableStones?: string[] }
  variants: Variant[]
}

/** The old website's stone codes → the CMS's gemstones (src/vigor/options.ts) */
const STONES: Record<string, string> = {
  AGB: 'Blue agate',
  AGF: 'Fancy agate',
  AGG: 'Green agate',
  AGK: 'Black agate',
  AGL: 'Lavender agate',
  AGM: 'Moss agate',
  AGP: 'Pink agate',
  AGR: 'Red agate',
  AGS: 'Botswana agate',
  AML: 'Lavender amethyst',
  AMY: 'Amethyst',
  AMZ: 'Amazonite',
  AVG: 'Green aventurine',
  AVP: 'Peach aventurine',
  AVR: 'Red aventurine',
  BKS: 'Black stone',
  BLA: 'Blue lace agate',
  CAL: 'Yellow calcite',
  CAR: 'Carnelian',
  CAT: "Cat's eye (synthetic)",
  CIH: 'Hydrothermal citrine',
  CIT: 'Citrine',
  COR: 'Bamboo coral (dyed)',
  CRY: 'Crystal quartz',
  DAP: 'Purple agate (dyed)',
  DH2: 'White and dyed howlite',
  DHW: 'Dyed howlite',
  DUM: 'Dumortierite',
  FLR: 'Rainbow fluorite',
  FLU: 'Fluorite',
  GAN: 'Garnet',
  GDB: 'Blue goldstone',
  GDS: 'Goldstone',
  GLS: 'Green lace stone',
  HEM: 'Hematite',
  HOW: 'White howlite',
  JBC: 'Jadeite (B+C treated)',
  JCN: 'South China jade',
  JDK: 'Korea jade',
  JLM: 'Lemon new jade',
  JNW: 'New jade',
  JQH: 'Qinghai jade',
  LAB: 'Labradorite',
  LAP: 'Lapis lazuli',
  LEP: 'Lepidolite',
  MAL: 'Malachite',
  MOP: 'Mother of pearl',
  OBK: 'Black obsidian',
  OBS: 'Snowflake obsidian',
  ON2: 'Black and white onyx',
  ONB: 'Black onyx',
  ONW: 'White onyx',
  PAR: 'Artistic jasper',
  PBL: 'Black line jasper',
  PBR: 'Brecciated jasper',
  PBU: 'Butter jasper',
  PDA: 'Dalmatian jasper',
  PFL: 'Flower jasper',
  PGT: 'Yellow turquoise jasper',
  PLE: 'Leopard skin jasper',
  PMK: 'Mookaite jasper',
  POC: 'Ocean jasper',
  PPC: 'Picasso jasper',
  PPI: 'Picture jasper',
  PPS: 'Peach stone',
  PRD: 'Red jasper',
  PRP: 'Red picture jasper',
  PZB: 'Zebra jasper',
  QRU: 'Rutilated quartz',
  QZL: 'Lemon quartz',
  QZO: 'Olive quartz',
  QZR: 'Rose quartz',
  QZS: 'Smoky quartz',
  QZW: 'White quartz',
  RHO: 'Rhodonite',
  S7M: 'Mixed stones',
  SOD: 'Sodalite',
  T3E: 'Three-color tiger eye',
  TLE: 'Tourmaline',
  TQI: 'Imitation tourmaline',
  TQN: 'Turquoise',
  TYE: 'Tiger eye',
  UKE: 'Unakite',
  ZCY: 'Crackle quartz',
}

/** Old stone codes that are metals, not stones */
const METAL_CODES: Record<string, string> = { AG: 'silver', AU: 'gold', CU: 'copper' }

/** Old style codes of the silver jewelry catalogs */
const SILVER_CODE = /^(?:JS|PJS|EJS|NJS|GJS|SJ)\d/

const HINTS = ['likely', 'check', 'old', 'doubtful']
const FLAGS = ['--dry-run', '--no-images', '--only-legit']
const VALUE_OPTIONS = ['--hint=', '--catalog=']
const DEFAULT_CATALOG = 'export/legacy-catalog.json'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const withImages = !args.includes('--no-images')
const onlyLegit = args.includes('--only-legit')
const optionValue = (name: string) => args.find((arg) => arg.startsWith(name))?.slice(name.length)
const hints = optionValue('--hint=')?.split(',').map((hint) => hint.trim().toLowerCase())
const catalogFile = optionValue('--catalog=') || DEFAULT_CATALOG
const folder = args.find((arg) => !arg.startsWith('-'))
// A mistyped --dry-run must not run a real import
const unknownOptions = args.filter(
  (arg) =>
    arg.startsWith('-') &&
    !FLAGS.includes(arg) &&
    !VALUE_OPTIONS.some((option) => arg.startsWith(option)),
)
const unknownHints = (hints ?? []).filter((hint) => !HINTS.includes(hint))

if (unknownOptions.length) {
  console.error(`Unknown option: ${unknownOptions.join(' ')}`)
}
if (unknownHints.length) {
  console.error(`Unknown hint: ${unknownHints.join(', ')} (use ${HINTS.join(', ')})`)
}

if (unknownOptions.length || unknownHints.length || !folder) {
  console.error(
    'Usage: pnpm payload run scripts/import-legacy-catalog.ts <old_vgems folder> [--dry-run] [--only-legit] [--hint=likely,check] [--no-images] [--catalog=<file>]',
  )
  process.exit(1)
}

const catalogPath = path.resolve(folder, catalogFile)

if (!fs.existsSync(catalogPath)) {
  console.error(
    `${catalogPath} doesn't exist. Use a checkout of atorpos/old_vgems with export/legacy-catalog.json (made by its export/build_catalog.py).`,
  )
  process.exit(1)
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as { products?: LegacyProduct[] }

if (!Array.isArray(catalog.products)) {
  console.error(`${catalogPath} has no "products": is it the old website's catalog?`)
  process.exit(1)
}

// The choices this script fills in must exist in src/vigor/options.ts, or the products can't be published
const choices = (list: { value: string }[]) => new Set(list.map(({ value }) => value))
const categoryChoices = choices(productCategories)
const stoneChoices = choices(gemstones)
const metalChoices = choices(metals)
const unitChoices = choices(units)
const missingChoices = [
  ...Object.values(STONES).filter((stone) => !stoneChoices.has(stone)),
  ...['Various stones'].filter((stone) => !stoneChoices.has(stone)),
  ...['Sterling silver', 'Sterling silver clasp', 'Loose (unset)', 'No metal'].filter(
    (metal) => !metalChoices.has(metal),
  ),
  ...['piece', 'strand'].filter((unit) => !unitChoices.has(unit)),
]

if (missingChoices.length) {
  console.error(`Add these choices to src/vigor/options.ts first: ${missingChoices.join(', ')}`)
  process.exit(1)
}

const payload = await getPayload({ config })

// On a new database, MongoDB is still creating collections and indexes in the background, and a
// write meanwhile can fail. An index that can't be built doesn't stop the import.
const models = Object.values((payload.db as MongooseAdapter).connection.models)
await Promise.allSettled(models.map((model) => model.init()))

const defaultLocale = (payload.config.localization || undefined)?.defaultLocale as
  | TypedLocale
  | undefined
// Drafts don't change the website, so it isn't told about them
const context = { disableRevalidate: true }
const counts = { added: 0, exists: 0, filtered: 0, notLegit: 0, photos: 0, unmarked: 0 }

if (dryRun) {
  console.log('Dry run: nothing is saved.\n')
}

for (const [index, product] of catalog.products.entries()) {
  const code = product.code

  if (product.legit === false) {
    counts.notLegit++
    continue
  }
  if (onlyLegit && product.legit !== true) {
    counts.unmarked++
    continue
  }
  if (hints && !hints.includes(product.hint)) {
    counts.filtered++
    continue
  }

  const { docs } = await payload.find({
    collection: 'vigor-products',
    depth: 0,
    draft: true,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { or: [{ sku: { equals: code } }, { legacyCode: { equals: code } }] },
  })

  if (docs[0]) {
    counts.exists++
    console.log(`  skip  ${code}  ${product.name ?? ''}  [already in the CMS]`)
    continue
  }

  const { data, photoPath } = toProduct(product, index)
  const photo = withImages && photoPath && fs.existsSync(photoPath) ? photoPath : undefined

  counts.added++
  if (photo) {
    counts.photos++
  }
  console.log(
    `  ${dryRun ? 'new ' : 'added'}  ${(product.category ?? '?').padEnd(11)} ${code.padEnd(8)} ${String(data.name)}  (${[product.hint, photo ? 'photo' : 'no photo'].join(', ')})`,
  )
  if (photoPath && withImages && !photo) {
    console.warn(`        photo not found: ${photoPath}`)
  }

  if (dryRun) {
    continue
  }

  const imageID = photo ? await importPhoto({ alt: String(data.name), code, file: photo }) : undefined

  await payload.create({
    collection: 'vigor-products',
    context,
    data: { ...data, ...(imageID ? { image: imageID } : {}), _status: 'draft' } as never,
    draft: true,
    locale: defaultLocale,
    overrideAccess: true,
  })
}

const left = [
  counts.exists && `skipped ${counts.exists} already in the CMS`,
  counts.notLegit && `left out ${counts.notLegit} marked "legit": false`,
  counts.unmarked && `${counts.unmarked} not marked "legit": true`,
  counts.filtered && `${counts.filtered} with other hints`,
].filter(Boolean)

console.log(
  `\n${dryRun ? 'Would add' : 'Added'} ${counts.added} draft products, ${counts.photos} with a photo${left.length ? `; ${left.join(', ')}` : ''}.`,
)
if (!dryRun && counts.added) {
  console.log('Check them in the admin panel under Vigor website → Products, and publish the ones to keep.')
}
process.exit(0)

/** The CMS product for an old style code, and the path of its best photo */
function toProduct(product: LegacyProduct, index: number) {
  const guessed: string[] = []
  const name = cleanName(product.name) ?? `${product.category ?? 'Style'} ${product.code}`
  const category =
    product.category && categoryChoices.has(product.category) ? product.category : undefined

  // Stones: the variants' stone codes, and the ones a special-offer list said were available
  const codes = new Set(product.variants.map((variant) => variant.stone).filter(isString))
  for (const available of product.specs?.availableStones ?? []) {
    const match = /\(([A-Z0-9]+)\)$/.exec(available)
    if (match) {
      codes.add(match[1]!)
    }
  }
  const stones = [...new Set([...codes].map((stoneCode) => STONES[stoneCode]).filter(isString))]
  const stone = stones.length === 1 ? stones[0] : stones.length > 1 ? 'Various stones' : undefined

  const types = product.variants.map((variant) => variant.specs?.type).filter(isString)
  const text = [name, ...(product.otherNames ?? []), ...types].join(' ').toLowerCase()
  let metal: string | undefined
  if (types.some((type) => /silver cla[sp]/i.test(type))) {
    metal = 'Sterling silver clasp'
  } else if (
    SILVER_CODE.test(product.code) ||
    /\b(?:925|silver)\b/.test(text) ||
    codes.has('AG')
  ) {
    metal = 'Sterling silver'
  } else if (['Beads', 'Cabochons', 'Carvings', 'Globes'].includes(category ?? '')) {
    metal = 'Loose (unset)'
  } else if (['Bracelets', 'Pendants'].includes(category ?? '')) {
    metal = 'No metal'
  }
  guessed.push(metal ? `metal (${metal})` : 'metal (left empty: choose one)')

  const sizes = [...new Set(product.variants.flatMap((variant) => variant.sizes ?? []))].sort(bySize)
  const lengths = [...new Set(product.variants.map((variant) => variant.specs?.length).filter(isString))]
  const weight =
    [
      sizes.length && `${sizes.slice(0, 8).map(prettySize).join(', ')}${sizes.length > 8 ? '…' : ''}`,
      lengths.length && `length ${lengths.join(', ')}`,
    ]
      .filter(Boolean)
      .join('; ') || undefined
  if (!weight) {
    guessed.push('size (left empty: no size in the old records)')
  }

  const beads = category === 'Beads'
  const unit = beads ? 'strand' : 'piece'
  const moq = beads ? 100 : 1
  guessed.push(
    beads
      ? 'minimum order (100 strands per style, stone and size, from the 2008 bead catalog)'
      : 'minimum order (1: not in the old records)',
  )

  const available = stones.length > 1 ? `Available in ${listOf(stones)}.` : ''
  const summary = product.description
    ? sentence(product.description)
    : `${name}${stones.length === 1 ? ` in ${stones[0]}` : ''}.${available ? ` ${available}` : ''}`
  if (!product.description) {
    guessed.push('summary (written from the name and stones)')
  }

  const perStone = product.variants
    .filter((variant) => variant.stone && STONES[variant.stone])
    .map((variant) => {
      const variantSizes = (variant.sizes ?? []).map(prettySize)
      return `${STONES[variant.stone!]}${variantSizes.length ? ` (${variantSizes.join(', ')})` : ''}`
    })
  const specs = [...new Set(types)].map((type) => `Type: ${type.toLowerCase()}`)
  const body = [
    perStone.length > 1 && `Available in: ${[...new Set(perStone)].join('; ')}.`,
    [...specs, ...lengths.map((length) => `length ${length}`)].join(', '),
  ]
    .filter(Boolean)
    .map((paragraph) => sentence(String(paragraph)))
    .join('\n\n')

  return {
    data: {
      name,
      ...(category ? { category } : {}),
      ...(stone ? { stone } : {}),
      ...(metal ? { metal } : {}),
      ...(weight ? { weight } : {}),
      moq,
      unit,
      summary,
      ...(body ? { body } : {}),
      slug: slugify(`${name} ${product.code}`),
      sku: product.code,
      sortOrder: 1000 + index,
      legacyCode: product.code,
      legacyHint: product.hint,
      ...(product.lastSeen ? { legacyLastSeen: product.lastSeen } : {}),
      legacyNotes: notesOf(product, guessed),
    },
    photoPath: product.photo ? path.resolve(folder!, product.photo) : undefined,
  }
}

/** Everything the old records say, for the "Old website: notes" field */
function notesOf(product: LegacyProduct, guessed: string[]) {
  const decision =
    product.legit === true ? 'keep' : product.legit === false ? 'drop' : 'not decided yet'
  const lines = [
    `Hint: ${product.hint} (${product.hintReasons.join('; ')}).`,
    `Your decision in the catalog file: ${decision}.${product.reviewNote ? ` Note: ${product.reviewNote}` : ''}`,
    `Last seen: ${product.lastSeen ?? 'unknown'}. Seen in: ${product.seenIn.join('; ')}.`,
  ]
  if (product.otherNames?.length) {
    lines.push(`Other names in the old records: ${product.otherNames.join('; ')}.`)
  }
  if (product.categorySource) {
    lines.push(`Category ${product.category ?? 'unknown'}: ${product.categorySource}.`)
  }
  if (product.description) {
    lines.push(`Old description: ${product.description}`)
  }

  const variants = product.variants.map((variant) => {
    const label = variant.stone
      ? `${variant.stone} ${STONES[variant.stone] ?? METAL_CODES[variant.stone] ?? variant.stoneName ?? ''}`
      : variant.stoneName || 'stone not given'
    const details = [
      variant.sizes?.join(', '),
      variant.oldPriceUsd &&
        `old price ${Object.entries(variant.oldPriceUsd)
          .map(([size, price]) => (size === 'any' ? `$${price}` : `$${price} (${size})`))
          .join(', ')}`,
      variant.skus?.length && `SKU ${variant.skus.join(', ')}`,
      variant.specs && Object.values(variant.specs).join(', '),
      variant.photos?.length && `${variant.photos.length} photo${variant.photos.length > 1 ? 's' : ''}`,
    ].filter(Boolean)
    return `- ${label.trim()}${details.length ? `: ${details.join('; ')}` : ''}`
  })
  if (variants.length) {
    lines.push('', 'Stones in the old records:', ...variants)
  }

  const catalogText = (product.catalogText ?? []).filter((entry) => entry.text)
  if (catalogText.length) {
    lines.push(
      '',
      'Old printed catalogs:',
      ...catalogText.map(
        (entry) => `- ${entry.pdf}, page ${entry.page}${entry.year ? ` (${entry.year})` : ''}: ${entry.text}`,
      ),
    )
  }

  lines.push(
    '',
    `Photo: ${product.photo ?? 'none on the old website'}`,
    '',
    `Filled in by the import, please check: ${guessed.join('; ')}.`,
  )
  return lines.join('\n')
}

/** Saves a photo from the old website in Media. Returns its ID, or nothing if it can't be read. */
async function importPhoto({ alt, code, file }: { alt: string; code: string; file: string }) {
  try {
    const data = fs.readFileSync(file)
    const extension = path.extname(file).slice(1).toLowerCase()
    const mimetype =
      { gif: 'image/gif', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png' }[extension] ??
      'application/octet-stream'
    const media = await payload.create({
      collection: 'media',
      context,
      data: { alt },
      file: {
        name: `${code}-${path.basename(file)}`.toLowerCase(),
        data,
        mimetype,
        size: data.length,
      },
      overrideAccess: true,
    })
    return String(media.id)
  } catch (err) {
    console.warn(
      `        could not import the photo ${file}: ${err instanceof Error ? err.message : String(err)}`,
    )
    return undefined
  }
}

/** "TRIANGLE BRACELET" → "Triangle Bracelet", "roundel bracelet" → "Roundel bracelet" */
function cleanName(name: null | string) {
  const trimmed = name?.replace(/\s+/g, ' ').trim()
  if (!trimmed) {
    return undefined
  }
  if (trimmed === trimmed.toUpperCase() && /[A-Z]{2}/.test(trimmed)) {
    return trimmed.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
  }
  return trimmed[0]!.toUpperCase() + trimmed.slice(1)
}

/** "12x28mm" → "12 × 28 mm" */
function prettySize(size: string) {
  return size.replace(/(\d)x(?=\d)/g, '$1 × ').replace(/(\d)mm$/, '$1 mm')
}

function bySize(a: string, b: string) {
  const first = (size: string) => Number.parseFloat(size) || Number.MAX_VALUE
  return first(a) - first(b) || a.localeCompare(b)
}

function listOf(items: string[]) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

function sentence(text: string) {
  const trimmed = text.trim()
  const capitalized = trimmed[0] ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
