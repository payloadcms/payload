/**
 * Imports exhibitions and trade shows from a JSON file into the Events collection.
 *
 *   pnpm payload run scripts/import-events.ts <file.json> --dry-run   # only show what would happen
 *   pnpm payload run scripts/import-events.ts <file.json>             # import
 *
 * On the server, deploy/import-events.sh runs this inside Docker (README: "Importing events").
 *
 * The file holds `{ "exhibitions": [...] }` or a plain array of:
 *   {
 *     "event_name": "JCK Las Vegas",
 *     "exact_date": "June 4 - 7, 2027",          // also "Oct 30 - Nov 1, 2026", "April 2027 (exact dates TBC)"
 *     "duration_days": 4,                         // optional, cross-checked against the dates
 *     "location": "The Venetian Expo, Las Vegas, NV, USA",   // [venue, [street,]] city, [US state,] country
 *     "business_nature": "Fine Jewelry Trade Show"           // optional, becomes the description
 *   }
 *
 * Nothing is written when any entry can't be read. Events that already exist (same name, starting
 * within 60 days) are skipped, so running the same file twice is safe and keeps your own edits.
 */
/* eslint-disable no-console -- a command-line script */
import fs from 'node:fs'
import { getPayload } from 'payload'

import type { Event } from '../src/payload-types'

import config from '../src/payload.config'

type Timezone = NonNullable<Event['startDate_tz']>

type SourceEvent = {
  business_nature?: null | string
  duration_days?: null | number
  event_name?: null | string
  exact_date?: null | string
  location?: null | string
}

type Day = { day: number; month: number; year: number }

type ParsedEvent = {
  address?: string
  city: string
  country: string
  /** Only the month is known */
  datesTBC: boolean
  description?: string
  end?: Day
  name: string
  notes: string[]
  start: Day
  timezone: string
  type: 'conference' | 'exhibition' | 'tradeShow'
  venue?: string
}

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

const COUNTRY_TIMEZONES: Record<string, string> = {
  australia: 'Australia/Sydney',
  bahrain: 'Asia/Bahrain',
  china: 'Asia/Shanghai',
  france: 'Europe/Paris',
  germany: 'Europe/Berlin',
  'hong kong': 'Asia/Hong_Kong',
  india: 'Asia/Calcutta',
  indonesia: 'Asia/Jakarta',
  italy: 'Europe/Rome',
  japan: 'Asia/Tokyo',
  malaysia: 'Asia/Kuala_Lumpur',
  mexico: 'America/Mexico_City',
  poland: 'Europe/Warsaw',
  qatar: 'Asia/Qatar',
  russia: 'Europe/Moscow',
  'saudi arabia': 'Asia/Riyadh',
  singapore: 'Asia/Singapore',
  'south korea': 'Asia/Seoul',
  'sri lanka': 'Asia/Colombo',
  switzerland: 'Europe/Zurich',
  taiwan: 'Asia/Taipei',
  thailand: 'Asia/Bangkok',
  turkey: 'Europe/Istanbul',
  türkiye: 'Europe/Istanbul',
  uae: 'Asia/Dubai',
  uk: 'Europe/London',
  'united arab emirates': 'Asia/Dubai',
  'united kingdom': 'Europe/London',
}

const US_NAMES = new Set(['united states', 'us', 'usa'])

// Mainland US states by time zone (where a state spans two, its larger part)
const US_STATE_TIMEZONES: Record<string, string> = {
  ...Object.fromEntries(
    'CT DC DE FL GA IN KY MA MD ME MI NC NH NJ NY OH PA RI SC VA VT WV'
      .split(' ')
      .map((state) => [state, 'America/New_York']),
  ),
  ...Object.fromEntries(
    'AL AR IA IL KS LA MN MO MS ND NE OK SD TN TX WI'
      .split(' ')
      .map((state) => [state, 'America/Chicago']),
  ),
  ...Object.fromEntries('CO ID MT NM UT WY'.split(' ').map((state) => [state, 'America/Denver'])),
  ...Object.fromEntries('CA NV OR WA'.split(' ').map((state) => [state, 'America/Los_Angeles'])),
  AK: 'America/Anchorage',
  AZ: 'America/Phoenix',
  HI: 'Pacific/Honolulu',
}

// Countries that are a single city, so "Venue, Hong Kong" has no separate city part
const CITY_STATES = new Set(['hong kong', 'singapore'])

const SEARCH_WINDOW_DAYS = 60

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const file = args.find((arg) => !arg.startsWith('--'))

if (!file) {
  console.error('Usage: pnpm payload run scripts/import-events.ts <file.json> [--dry-run]')
  process.exit(1)
}

const json = JSON.parse(fs.readFileSync(file, 'utf8')) as
  | { events?: SourceEvent[]; exhibitions?: SourceEvent[] }
  | SourceEvent[]
const entries = Array.isArray(json) ? json : (json.exhibitions ?? json.events ?? [])

// Read every entry first; write nothing if any of them has a problem
const parsed: ParsedEvent[] = []
const problems: string[] = []

entries.forEach((entry, index) => {
  try {
    parsed.push(parseEvent(entry))
  } catch (err) {
    problems.push(
      `#${index + 1} ${entry?.event_name ?? '(no name)'}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
})

if (problems.length) {
  console.error(`Nothing imported. Fix these ${problems.length} entries and run again:\n`)
  console.error(problems.map((problem) => `  ${problem}`).join('\n'))
  process.exit(1)
}

const payload = await getPayload({ config })
let created = 0
let skipped = 0

if (dryRun) {
  console.log('Dry run: nothing is saved.\n')
}

for (const event of parsed) {
  const startDate = zonedMidnight(event.start, event.timezone)
  const existing = await findExisting(event, startDate)
  const line = `${formatRange(event)}  ${event.name}  —  ${[event.city, event.country].join(', ')} (${event.timezone})`

  if (existing) {
    skipped++
    console.log(`  skip  ${line}  [already exists]`)
    continue
  }

  if (!dryRun) {
    await payload.create({
      collection: 'events',
      data: {
        name: event.name,
        type: event.type,
        description: event.description,
        endDate: event.end ? zonedMidnight(event.end, event.timezone) : undefined,
        endDate_tz: event.end ? (event.timezone as Timezone) : undefined,
        location: {
          address: event.address,
          city: event.city,
          country: event.country,
          venue: event.venue,
        },
        notes: event.notes.length ? event.notes.join('\n') : undefined,
        startDate,
        startDate_tz: event.timezone as Timezone,
        status: 'planned',
      },
      overrideAccess: true,
    })
  }

  created++
  console.log(`  ${dryRun ? 'new ' : 'added'}  ${line}${event.notes.length ? '  [see notes]' : ''}`)
}

console.log(
  `\n${dryRun ? 'Would add' : 'Added'} ${created} events, skipped ${skipped} that already exist.`,
)
process.exit(0)

function parseEvent(entry: SourceEvent): ParsedEvent {
  const name = entry.event_name?.trim()
  if (!name) {
    throw new Error('event_name is missing')
  }

  const notes: string[] = []
  const dates = parseDates(entry.exact_date ?? '', notes)
  const location = parseLocation(entry.location ?? '', notes)

  if (dates.end && entry.duration_days) {
    const days = Math.round((dayNumber(dates.end) - dayNumber(dates.start)) / 86_400_000) + 1
    if (days !== entry.duration_days) {
      notes.push(
        `Check the dates: the source says ${entry.duration_days} days, the dates span ${days}.`,
      )
    }
  }

  const description = entry.business_nature?.trim() || undefined

  return { ...dates, ...location, name, type: eventType(description), description, notes }
}

/**
 * "October 2 - 4, 2026", "October 30 - November 1, 2026", "December 30, 2026 - January 2, 2027",
 * "June 5, 2027". Anything else that names a month and a year, such as "April 2027 (exact dates TBC)",
 * starts on the 1st of that month and is noted as to be confirmed.
 */
function parseDates(text: string, notes: string[]): { datesTBC: boolean; end?: Day; start: Day } {
  const value = text.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim()
  const month = '([a-z]+)\\.?'
  const patterns: [RegExp, (m: string[]) => [Day, Day?]][] = [
    // October 2 - 4, 2026
    [
      new RegExp(`^${month} (\\d{1,2}) ?- ?(\\d{1,2}),? (\\d{4})$`, 'i'),
      (m) => [day(m[4], m[1], m[2]), day(m[4], m[1], m[3])],
    ],
    // October 30 - November 1, 2026
    [
      new RegExp(`^${month} (\\d{1,2}) ?- ?${month} (\\d{1,2}),? (\\d{4})$`, 'i'),
      (m) => [day(m[5], m[1], m[2]), day(m[5], m[3], m[4])],
    ],
    // December 30, 2026 - January 2, 2027
    [
      new RegExp(`^${month} (\\d{1,2}),? (\\d{4}) ?- ?${month} (\\d{1,2}),? (\\d{4})$`, 'i'),
      (m) => [day(m[3], m[1], m[2]), day(m[6], m[4], m[5])],
    ],
    // June 5, 2027
    [new RegExp(`^${month} (\\d{1,2}),? (\\d{4})$`, 'i'), (m) => [day(m[3], m[1], m[2])]],
  ]

  for (const [pattern, toDays] of patterns) {
    const match = pattern.exec(value)
    if (match) {
      const [start, end] = toDays(match)
      if (end && dayNumber(end) < dayNumber(start)) {
        throw new Error(`"${text}" ends before it starts`)
      }
      return { datesTBC: false, end, start }
    }
  }

  // Only a month is known
  const monthName = new RegExp(`\\b(${MONTHS.join('|')})\\b`, 'i').exec(value)?.[1]
  const year = /\b(20\d{2})\b/.exec(value)?.[1]

  if (monthName && year) {
    notes.push(`Dates to be confirmed: ${text}`)
    return { datesTBC: true, start: day(year, monthName, '1') }
  }

  throw new Error(`can't read the date "${text}"`)
}

function day(year: string, month: string, dayOfMonth: string): Day {
  const index = MONTHS.findIndex((name) => name.startsWith(month.toLowerCase().slice(0, 3)))
  const result = { day: Number(dayOfMonth), month: index + 1, year: Number(year) }
  const check = new Date(Date.UTC(result.year, result.month - 1, result.day))

  if (index < 0 || month.length < 3 || check.getUTCDate() !== result.day) {
    throw new Error(`"${month} ${dayOfMonth}, ${year}" isn't a date`)
  }
  return result
}

function dayNumber({ day, month, year }: Day) {
  return Date.UTC(year, month - 1, day)
}

/**
 * "Venue, 198 Street, City, ST, USA" → venue, address (parts starting with a number), city, country.
 * A trailing "(…)" remark goes to the notes; brackets inside the venue stay.
 */
function parseLocation(text: string, notes: string[]) {
  let value = text.trim()
  const remark = /\s*\(([^()]*)\)$/.exec(value)

  if (remark && splitParts(value.slice(0, remark.index)).length) {
    notes.push(`Location: ${remark[1]}`)
    value = value.slice(0, remark.index)
  }

  const parts = splitParts(value)
  const country = parts.pop()

  if (!country) {
    throw new Error('location is missing')
  }

  let timezone: string | undefined
  let city: string | undefined

  if (US_NAMES.has(country.toLowerCase())) {
    const state = parts.pop()?.toUpperCase()
    timezone = state ? US_STATE_TIMEZONES[state] : undefined
    if (!timezone) {
      throw new Error(
        `US location "${text}" needs a state code before the country, e.g. "Austin, TX, USA"`,
      )
    }
    city = parts.pop()
  } else if (CITY_STATES.has(country.toLowerCase())) {
    city = country
  } else {
    city = parts.pop()
  }

  timezone ??=
    (country.toLowerCase() === 'australia' && city && australianTimezone(city)) ||
    COUNTRY_TIMEZONES[country.toLowerCase()]

  if (!timezone) {
    throw new Error(
      `no time zone for the country "${country}": add it to COUNTRY_TIMEZONES in scripts/import-events.ts`,
    )
  }

  if (!city) {
    notes.push('City to be confirmed.')
  }

  const address = parts.filter((part) => /^\d/.test(part)).join(', ') || undefined
  const venue = parts.filter((part) => !/^\d/.test(part)).join(', ') || undefined

  return { address, city: city ?? 'TBC', country, timezone, venue }
}

/** Splits on commas outside brackets: "A (x, y), B" → ["A (x, y)", "B"] */
function splitParts(text: string) {
  const parts: string[] = []
  let depth = 0
  let current = ''

  for (const char of text) {
    depth += char === '(' ? 1 : char === ')' ? -1 : 0
    if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current)

  return parts.map((part) => part.trim()).filter(Boolean)
}

function australianTimezone(city: string) {
  const zones: Record<string, string> = {
    adelaide: 'Australia/Adelaide',
    brisbane: 'Australia/Brisbane',
    darwin: 'Australia/Darwin',
    perth: 'Australia/Perth',
  }
  return zones[city.toLowerCase()]
}

function eventType(description = ''): ParsedEvent['type'] {
  if (/conference|symposium|summit/i.test(description)) {
    return 'conference'
  }
  if (/trade|b2b|wholesale|sourcing|dealer/i.test(description)) {
    return 'tradeShow'
  }
  return 'exhibition'
}

/** Midnight of `date` in `timeZone`, as a UTC ISO string */
function zonedMidnight(date: Day, timeZone: string) {
  const guess = dayNumber(date)
  const first = guess - offsetAt(guess, timeZone)
  // Correct once in case the offset differs at midnight local time (daylight saving)
  return new Date(guess - offsetAt(first, timeZone)).toISOString()
}

/** How far `timeZone` is ahead of UTC at `time`, in milliseconds */
function offsetAt(time: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      hour: 'numeric',
      hourCycle: 'h23',
      minute: 'numeric',
      month: 'numeric',
      second: 'numeric',
      timeZone,
      year: 'numeric',
    })
      .formatToParts(time)
      .map(({ type, value }) => [type, Number(value)]),
  )
  const local = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return local - Math.floor(time / 1000) * 1000
}

async function findExisting(event: ParsedEvent, startDate: string) {
  const start = new Date(startDate).getTime()
  const window = SEARCH_WINDOW_DAYS * 86_400_000
  const { docs } = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    select: { name: true },
    where: {
      and: [
        { name: { equals: event.name } },
        { startDate: { greater_than_equal: new Date(start - window).toISOString() } },
        { startDate: { less_than_equal: new Date(start + window).toISOString() } },
      ],
    },
  })
  return docs[0]
}

function formatRange({ datesTBC, end, start }: ParsedEvent) {
  const iso = ({ day, month, year }: Day) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const text = datesTBC
    ? `${iso(start).slice(0, 7)} (dates TBC)`
    : end
      ? `${iso(start)} → ${iso(end)}`
      : iso(start)
  return text.padEnd(23)
}
