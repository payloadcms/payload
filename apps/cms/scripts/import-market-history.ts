/**
 * Adds ten years of prices to the VgemsAI app's Research tab (VgemsAI App → Market Prices), from the
 * files in scripts/market-history (README: "Market prices"; where they come from: SOURCES.md there).
 *
 *   pnpm payload run scripts/import-market-history.ts --dry-run   # only show what would happen
 *   pnpm payload run scripts/import-market-history.ts             # import
 *
 * On the server, deploy/import-market-history.sh runs this inside Docker.
 *
 * One file per material, named by its key (gold.csv, oil.csv …), with the columns date (YYYY-MM-DD),
 * price (in the material's unit) and source (world-bank, eia or manual). A day that already has a
 * price keeps it, so running it again is safe and keeps API Ninjas' prices and those entered by hand.
 * Nothing is saved when a file can't be read or names a material the CMS doesn't have.
 */
/* eslint-disable no-console -- a command-line script */
import type { MarketPrice } from '../src/payload-types'

import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

import config from '../src/payload.config'

type Price = { date: string; price: number; source: MarketPrice['source'] }

const OPTIONS = ['--dry-run']
const SOURCES: MarketPrice['source'][] = ['eia', 'manual', 'world-bank']
const HISTORY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'market-history')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
// A mistyped --dry-run must not run a real import
const unknownArgs = args.filter((arg) => !OPTIONS.includes(arg))

if (unknownArgs.length) {
  console.error(`Unknown option: ${unknownArgs.join(' ')}`)
  console.error('Usage: pnpm payload run scripts/import-market-history.ts [--dry-run]')
  process.exit(1)
}

const files = (await readdir(HISTORY_DIR)).filter((file) => file.endsWith('.csv')).sort()
const histories = new Map<string, Price[]>()
const problems: string[] = []

for (const file of files) {
  histories.set(
    path.basename(file, '.csv'),
    readPrices({
      name: file,
      problems,
      text: await readFile(path.join(HISTORY_DIR, file), 'utf8'),
    }),
  )
}

const payload = await getPayload({ config })
const { docs: materials } = await payload.find({
  collection: 'market-materials',
  depth: 0,
  overrideAccess: true,
  pagination: false,
  select: { key: true },
})
const materialIDs = new Map(materials.map((material) => [material.key, material.id]))

for (const key of histories.keys()) {
  if (!materialIDs.has(key)) {
    problems.push(
      `${key}.csv: there's no market material "${key}" (VgemsAI App → Market Materials)`,
    )
  }
}

if (problems.length) {
  console.error(`Nothing was imported:\n${problems.map((problem) => `  ${problem}`).join('\n')}`)
  process.exit(1)
}

if (dryRun) {
  console.log('Dry run: nothing is saved.\n')
}

for (const [key, prices] of histories) {
  const material = materialIDs.get(key)!
  const { docs } = await payload.find({
    collection: 'market-prices',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { date: true },
    where: { material: { equals: material } },
  })
  const savedDays = new Set(docs.map((doc) => doc.date.slice(0, 10)))
  const newPrices = prices.filter((price) => !savedDays.has(price.date))

  console.log(
    `  ${newPrices.length ? 'add ' : 'skip'}  ${key.padEnd(10)} ${newPrices.length} prices` +
      (prices.length
        ? ` (${prices[0]!.date} – ${prices[prices.length - 1]!.date}), ${prices.length - newPrices.length} days already have one`
        : ''),
  )

  if (dryRun) {
    continue
  }

  for (const { date, price, source } of newPrices) {
    await payload.create({
      collection: 'market-prices',
      // Stored at 12:00 UTC on the day, as the admin panel's date picker saves days
      data: { date: `${date}T12:00:00.000Z`, material, price, source },
      overrideAccess: true,
    })
  }
}

console.log(
  dryRun
    ? ''
    : '\nDone. The app shows them within 10 minutes (awoz-api reuses the prices that long).',
)
process.exit(0)

/** The prices in a CSV file, oldest first; what's wrong with it goes into `problems` */
function readPrices({
  name,
  problems,
  text,
}: {
  name: string
  problems: string[]
  text: string
}): Price[] {
  const [header, ...lines] = text.trim().split(/\r?\n/)

  if (header?.trim() !== 'date,price,source') {
    problems.push(`${name}: the first line must be "date,price,source"`)
    return []
  }

  const prices: Price[] = []
  const days = new Set<string>()
  for (const [index, line] of lines.entries()) {
    const [date = '', price = '', source = ''] = line.split(',').map((cell) => cell.trim())
    const where = `${name}, line ${index + 2}`

    if (!isDay(date)) {
      problems.push(`${where}: "${date}" isn't a real day written like 2026-10-28`)
    } else if (!(Number(price) > 0)) {
      problems.push(`${where}: "${price}" isn't a price above 0`)
    } else if (!SOURCES.includes(source as MarketPrice['source'])) {
      problems.push(`${where}: the source must be one of ${SOURCES.join(', ')}`)
    } else if (days.has(date)) {
      problems.push(`${where}: ${date} is in the file twice`)
    } else {
      days.add(date)
      prices.push({ date, price: Number(price), source: source as MarketPrice['source'] })
    }
  }

  return prices.sort((a, b) => a.date.localeCompare(b.date))
}

/** A real day written YYYY-MM-DD, e.g. not 2026-02-30 */
function isDay(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`)

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().startsWith(value)
  )
}
