import type { Endpoint, PayloadRequest, RequiredDataFromCollectionSlug, Where } from 'payload'

import type { Event } from '../payload-types'

import { dayNumber, isTimeZone, localDay, offsetAt, zonedMidnight } from '../zonedTime'
import { refuseWithoutAppApiKey } from './appApiKey'

/**
 * awoz-api's weekly search for gem, jewellery and raw material trade shows (EventDiscoveryJob there): it
 * reads the events the CMS knows, asks Claude to search the web for the others in the next 12 months, and
 * sends what Claude found back here to be added to Events. Server to server only, with
 * `X-API-Key: <APP_API_KEY>` (see ./appApiKey.ts); while APP_API_KEY is empty both endpoints answer 404.
 *
 * Days are written `YYYY-MM-DD`, in the event's own time zone.
 */

const DAY_MS = 24 * 60 * 60 * 1000
/** Known events sent to awoz-api: this far back, so Claude looks for their next edition, and ahead */
const KNOWN_PAST_DAYS = 400
const KNOWN_FUTURE_DAYS = 400
/** A found event starting this close to a known one with the same name is that event */
const SAME_EVENT_DAYS = 60
/** Found events may start this far ahead at most */
const MAX_DAYS_AHEAD = 400
/** No trade show lasts longer: a longer one is a mistake */
const MAX_EVENT_DAYS = 31
const MAX_EVENTS_PER_REQUEST = 200
const MAX_SOURCES = 5
const TYPES = ['exhibition', 'tradeShow', 'conference', 'salesEvent', 'other'] as const
/** Words that don't tell two event names apart */
const FILLER_WORDS = new Set(['a', 'and', 'of', 'the'])
/** Other names of countries, as nameWords() writes them */
const PLACE_ALIASES: Record<string, string> = {
  'great britain': 'united kingdom',
  'hong kong sar': 'hong kong',
  turkiye: 'turkey',
  uae: 'united arab emirates',
  uk: 'united kingdom',
  'united states of america': 'united states',
  us: 'united states',
  usa: 'united states',
}
/** Words many event names share */
const GENERIC_WORDS = new Set([
  'annual',
  'exhibition',
  'expo',
  'fair',
  'international',
  'show',
  'trade',
  'week',
])

type Timezone = NonNullable<Event['startDate_tz']>

type KnownEvent = Pick<Event, 'id' | 'location' | 'name' | 'startDate' | 'startDate_tz'>

/** What awoz-api sends for each event Claude found */
type FoundEvent = {
  address?: null | string
  city?: null | string
  country?: null | string
  /** False when only the month is known; startDate is then the 1st */
  datesConfirmed?: boolean | null
  description?: null | string
  endDate?: null | string
  name?: null | string
  organizer?: null | string
  /** Pages that show the dates, e.g. the organizer's */
  sources?: null | string[]
  startDate?: null | string
  /** Where it takes place, e.g. "Asia/Hong_Kong" */
  timeZone?: null | string
  type?: null | string
  venue?: null | string
  website?: null | string
}

/** A found event ready to be saved */
type NewEvent = {
  data: RequiredDataFromCollectionSlug<'events'>
  /** As sent, for the answer */
  day: string
  words: string[]
}

/**
 * `GET /api/app/event-discovery` - every event starting from about 13 months ago until 13 months ahead,
 * cancelled ones too, oldest first:
 *
 *   { events: [{ name, startDate: "2027-03-04", endDate: "2027-03-08" | null, city, country, status }] }
 */
export const appEventDiscoveryEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const now = Date.now()
    const { docs } = await req.payload.find({
      collection: 'events',
      depth: 0,
      // Internal collection: this endpoint's API key check replaces the logged-in check
      overrideAccess: true,
      pagination: false,
      select: {
        name: true,
        endDate: true,
        endDate_tz: true,
        location: { city: true, country: true },
        startDate: true,
        startDate_tz: true,
        status: true,
      },
      sort: 'startDate',
      where: {
        and: [
          { startDate: { greater_than_equal: isoDate(now - KNOWN_PAST_DAYS * DAY_MS) } },
          { startDate: { less_than: isoDate(now + KNOWN_FUTURE_DAYS * DAY_MS) } },
        ],
      },
    })

    return Response.json({
      events: docs.map((event) => ({
        name: event.name,
        city: event.location?.city ?? null,
        country: event.location?.country ?? null,
        endDate: event.endDate
          ? localDay(event.endDate, event.endDate_tz || event.startDate_tz || 'UTC')
          : null,
        startDate: localDay(event.startDate, event.startDate_tz || 'UTC'),
        status: event.status,
      })),
    })
  },
  method: 'get',
  path: '/app/event-discovery',
}

/**
 * `POST /api/app/event-discovery` - adds the events Claude found, each unless the CMS already has it:
 *
 *   { "events": [{ "name": "JCK Las Vegas", "type": "tradeShow", "description": "…",
 *                  "startDate": "2027-06-04", "endDate": "2027-06-07", "datesConfirmed": true,
 *                  "venue": "The Venetian Expo", "address": null, "city": "Las Vegas",
 *                  "country": "United States", "timeZone": "America/Los_Angeles",
 *                  "organizer": "RX", "website": "https://lasvegas.jckonline.com",
 *                  "sources": ["https://…"] }] }
 *
 * An event is already known when one starts within 60 days of it under the same name, ignoring years,
 * edition numbers and "jewellery" or "jewelry"; or under a name with the same words plus more, in the
 * same country; or under a similar name in the same city within 3 days (see isSameEvent). Each new
 * event is added as planned, marked "Found by Claude", with its sources in the notes. Apple Maps puts
 * it on the map (../hooks/locateEvent.ts).
 *
 * An event that can't be added (no city, dates in the past, an unknown time zone …) doesn't stop the
 * others. Answers which were added, which were known and which were rejected, and why:
 *
 *   { created: [{ id, name, startDate }], known: [{ name, startDate, sameAs }],
 *     rejected: [{ name, startDate, problems: ["…"] }] }
 */
export const appEventDiscoverySaveEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const body = (await req.json?.().catch(() => null)) as null | { events?: unknown }
    const found = body?.events

    if (!Array.isArray(found) || found.length > MAX_EVENTS_PER_REQUEST) {
      return Response.json(
        {
          errors: [
            {
              message: `events must be a list of at most ${MAX_EVENTS_PER_REQUEST} events.`,
              path: 'events',
            },
          ],
        },
        { status: 400 },
      )
    }

    const now = Date.now()
    const timezones = req.payload.config.admin.timezones.supportedTimezones.map(
      ({ value }) => value,
    )
    const known = await findKnownEvents(req, now)
    const answer = {
      created: [] as { id: number | string; name: string; startDate: string }[],
      known: [] as { name: string; sameAs: string; startDate: string }[],
      rejected: [] as { name: string; problems: string[]; startDate: null | string }[],
    }

    for (const item of found as unknown[]) {
      const event = (item && typeof item === 'object' ? item : {}) as FoundEvent
      const name = text(event.name) ?? '(no name)'
      const startDate = typeof event.startDate === 'string' ? event.startDate : null
      const result = toNewEvent({ event, now, timezones })

      if ('problems' in result) {
        answer.rejected.push({ name, problems: result.problems, startDate })
        continue
      }

      const sameAs = known.find((other) => isSameEvent(result, other))

      if (sameAs) {
        answer.known.push({ name, sameAs: sameAs.name, startDate: result.day })
        continue
      }

      try {
        const created = await req.payload.create({
          collection: 'events',
          data: result.data,
          overrideAccess: true,
        })

        answer.created.push({ id: created.id, name, startDate: result.day })
        // So that the same event found twice is added once
        known.push({ ...created, words: result.words })
      } catch (error) {
        req.payload.logger.warn({ err: error, msg: `Could not add the found event "${name}"` })
        answer.rejected.push({ name, problems: [(error as Error).message], startDate })
      }
    }

    return Response.json(answer)
  },
  method: 'post',
  path: '/app/event-discovery',
}

/** Events a found one may be the same as: those starting from shortly before today */
const findKnownEvents = async (req: PayloadRequest, now: number) => {
  const where: Where = {
    and: [
      { startDate: { greater_than_equal: isoDate(now - (SAME_EVENT_DAYS + 2) * DAY_MS) } },
      {
        startDate: {
          less_than_equal: isoDate(now + (MAX_DAYS_AHEAD + SAME_EVENT_DAYS + 2) * DAY_MS),
        },
      },
    ],
  }
  const { docs } = await req.payload.find({
    collection: 'events',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { name: true, location: true, startDate: true, startDate_tz: true },
    where,
  })

  return docs.map((event: KnownEvent) => ({ ...event, words: nameWords(event.name) }))
}

/** The event as the Events collection saves it, or what's wrong with it */
const toNewEvent = ({
  event,
  now,
  timezones,
}: {
  event: FoundEvent
  now: number
  timezones: string[]
}): { problems: string[] } | NewEvent => {
  const problems: string[] = []
  const name = text(event.name, 200)
  const city = text(event.city, 100)
  const country = text(event.country, 100)
  const start = toDay(event.startDate)
  const end = event.endDate ? toDay(event.endDate) : undefined
  const timeZone = text(event.timeZone) ?? ''

  if (!name) {
    problems.push('The name is missing.')
  }
  if (!city || !country) {
    problems.push('The city and the country are both needed.')
  }
  if (!start) {
    problems.push(`The start date "${String(event.startDate)}" isn't a day like 2027-03-04.`)
  }
  if (end === null) {
    problems.push(`The end date "${String(event.endDate)}" isn't a day like 2027-03-08.`)
  }
  if (!isTimeZone(timeZone)) {
    problems.push(`"${timeZone}" isn't a time zone like Asia/Hong_Kong.`)
  }
  if (problems.length || !start || end === null) {
    return { problems }
  }

  const startDate = zonedMidnight(start, timeZone)
  const endDate = end ? zonedMidnight(end, timeZone) : undefined
  const lastDay = dayNumber(end ?? start)
  const today = Date.parse(`${localDay(now, timeZone)}T00:00:00.000Z`)

  if (end && dayNumber(end) < dayNumber(start)) {
    problems.push('It ends before it starts.')
  } else if (lastDay - dayNumber(start) >= MAX_EVENT_DAYS * DAY_MS) {
    problems.push(`It lasts longer than ${MAX_EVENT_DAYS} days.`)
  }
  if (lastDay < today) {
    problems.push('It is over.')
  } else if (dayNumber(start) > today + MAX_DAYS_AHEAD * DAY_MS) {
    problems.push(`It starts more than ${MAX_DAYS_AHEAD} days from now.`)
  }

  const savedTimeZone = supportedTimeZone({
    timeZone,
    times: [startDate, endDate ?? startDate].map(Date.parse),
    timezones,
  })

  if (!savedTimeZone) {
    problems.push(
      `The CMS has no time zone with the same UTC offset as ${timeZone}: add one to src/timezones.ts.`,
    )
  }
  if (problems.length || !name || !city || !country || !savedTimeZone) {
    return { problems }
  }

  const website = text(event.website, 500)
  const sources = (Array.isArray(event.sources) ? event.sources : [])
    .map((source) => text(source, 500))
    .filter((source): source is string => Boolean(source && isUrl(source)))
    .slice(0, MAX_SOURCES)
  const notes = [
    `Found by Claude's weekly web search on ${new Date(now).toISOString().slice(0, 10)}. Check the dates and the place before relying on them.`,
    ...(event.datesConfirmed === false
      ? ['Dates to be confirmed: only the month was announced.']
      : []),
    ...(sources.length ? ['Sources:', ...sources] : []),
  ]

  return {
    data: {
      name,
      type: TYPES.includes(event.type as (typeof TYPES)[number])
        ? (event.type as (typeof TYPES)[number])
        : 'tradeShow',
      description: text(event.description, 1000),
      endDate,
      endDate_tz: endDate ? (savedTimeZone as Timezone) : undefined,
      foundBy: 'claude',
      location: {
        address: text(event.address, 300),
        city,
        country,
        venue: text(event.venue, 200),
      },
      notes: notes.join('\n'),
      organizer: text(event.organizer, 200),
      startDate,
      startDate_tz: savedTimeZone as Timezone,
      status: 'planned',
      // The Events collection takes full URLs only
      website: website && isUrl(website) ? website : undefined,
    },
    day: event.startDate as string,
    words: nameWords(name),
  }
}

/**
 * Same event: starts within 60 days of the other under the same name; or under a name with the same
 * words plus more, in the same country; or under a similar name in the same city within 3 days.
 * "Similar" and "more" leave out place names and words such as "International" or "Show", so the Hong
 * Kong Jewellery Show and the Hong Kong Diamond, Gem & Pearl Show of the same week stay two events.
 */
const isSameEvent = (event: NewEvent, other: { words: string[] } & KnownEvent) => {
  const days = Math.abs(Date.parse(event.data.startDate) - Date.parse(other.startDate)) / DAY_MS

  if (days > SAME_EVENT_DAYS) {
    return false
  }

  const [fewer, more] = [event.words, other.words].sort((a, b) => a.length - b.length) as [
    string[],
    string[],
  ]
  const shared = fewer.filter((word) => more.includes(word)).length

  if (shared > 0 && shared === more.length) {
    return true
  }

  const placeWords = new Set(
    nameWords(
      [event.data.location, other.location]
        .flatMap((location) => [location?.city, location?.country])
        .join(' '),
    ),
  )
  const distinctive = (words: string[]) =>
    words.filter((word) => !GENERIC_WORDS.has(word) && !placeWords.has(word))
  const sameCountry = isSamePlace(event.data.location.country, other.location?.country)

  if (sameCountry && shared === fewer.length && distinctive(fewer).length > 0) {
    return true
  }

  const sameCity = sameCountry && isSamePlace(event.data.location.city, other.location?.city)
  const words = distinctive(event.words)
  const otherWords = distinctive(other.words)
  const common = words.filter((word) => otherWords.includes(word)).length

  return (
    sameCity && days <= 3 && common > 0 && common / new Set([...words, ...otherWords]).size >= 0.6
  )
}

/** "The 45th JCK Las Vegas 2027" → ["jck", "las", "vegas"]; "Jewellery" and "Jewelry" are the same */
const nameWords = (name: string) => [
  ...new Set(
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/jewell?e?ry/g, 'jewelry')
      .replace(/centre/g, 'center')
      .split(/[^a-z0-9]+/)
      .filter(
        (word) =>
          word &&
          !FILLER_WORDS.has(word) &&
          // Years and edition numbers
          !/^(19|20)\d{2}$/.test(word) &&
          !/^\d+(st|nd|rd|th)$/.test(word),
      ),
  ),
]

const isSamePlace = (a: null | string | undefined, b: null | string | undefined) =>
  Boolean(a && b && placeName(a) === placeName(b))

/** "USA" and "United States" are the same country */
const placeName = (place: string) => {
  const name = nameWords(place).join(' ')
  return PLACE_ALIASES[name] ?? name
}

/**
 * A supported time zone (src/timezones.ts) for `timeZone`: itself, or one with the same UTC offset at
 * `times`, preferably in the same region ("Asia/…"). The dates are the same either way.
 */
const supportedTimeZone = ({
  timeZone,
  times,
  timezones,
}: {
  timeZone: string
  times: number[]
  timezones: string[]
}) => {
  if (timezones.includes(timeZone)) {
    return timeZone
  }

  const sameOffset = timezones.filter((zone) =>
    times.every((time) => offsetAt(time, zone) === offsetAt(time, timeZone)),
  )
  const region = timeZone.split('/')[0]

  return sameOffset.find((zone) => zone.startsWith(`${region}/`)) ?? sameOffset[0]
}

/** A real day written YYYY-MM-DD, e.g. not 2027-02-30; null for anything else */
const toDay = (value: unknown) => {
  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null

  if (!match) {
    return null
  }

  const day = { day: Number(match[3]), month: Number(match[2]), year: Number(match[1]) }
  const date = new Date(dayNumber(day))

  return date.getUTCMonth() + 1 === day.month && date.getUTCDate() === day.day ? day : null
}

/** Trimmed text, cut to `max` characters, or undefined when empty */
const text = (value: unknown, max = 2000) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined

const isUrl = (value: string) => /^https?:\/\/\S+$/.test(value)

const isoDate = (time: number) => new Date(time).toISOString()
