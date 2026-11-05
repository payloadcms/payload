import type { Endpoint, Where } from 'payload'

import type { Event } from '../payload-types'

import { refuseWithoutAppApiKey } from './appApiKey'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * `GET /api/app/events` - upcoming events from the private Events collection (under "Business") for
 * the VgemsAI app's backend (awoz-api), which passes them on to the app.
 *
 * Server to server only: the caller sends `X-API-Key: <APP_API_KEY>` (see ./appApiKey.ts). While
 * APP_API_KEY is empty the endpoint answers 404, as if it didn't exist.
 *
 * Only fields that are safe to show app users leave the CMS: never clients, notes or attachments.
 * `location.coordinates` is `{ latitude, longitude, precision }` once the event's place was found
 * (see src/hooks/locateEvent.ts), otherwise null. `precision` is `exact` (set by hand), `venue`,
 * `address`, `city` or `country`.
 * "Upcoming" means not over yet (still running, or starting later) and starting within the next 12
 * months. An end date without a time (00:00 in the event's time zone, as scripts/import-events.ts
 * saves them) means the whole of that day. Cancelled events are left out. Soonest first, in the same
 * `{ docs: [...] }` shape as Payload's REST API.
 */
export const appEventsEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const now = new Date()
    const until = new Date(now)
    until.setUTCMonth(until.getUTCMonth() + 12)

    // Loose filter for the database; isOver() below makes the exact cut
    const where: Where = {
      and: [
        { status: { not_equals: 'cancelled' } },
        { startDate: { less_than: until.toISOString() } },
        {
          or: [
            // A day early: an end date without a time lasts until the end of that day
            { endDate: { greater_than_equal: new Date(now.getTime() - DAY_MS).toISOString() } },
            // Single-day events have no end date
            { startDate: { greater_than_equal: new Date(now.getTime() - DAY_MS).toISOString() } },
          ],
        },
      ],
    }

    const { docs } = await req.payload.find({
      collection: 'events',
      depth: 0,
      // Internal collection: this endpoint's API key check replaces the logged-in check
      overrideAccess: true,
      pagination: false,
      select: {
        name: true,
        type: true,
        description: true,
        endDate: true,
        endDate_tz: true,
        location: true,
        organizer: true,
        startDate: true,
        startDate_tz: true,
        status: true,
        website: true,
      },
      sort: 'startDate',
      where,
    })

    return Response.json({
      docs: docs.filter((event) => !isOver({ event, now })).map(toAppEvent),
    })
  },
  method: 'get',
  path: '/app/events',
}

/** Copies only the public fields, so a field added to Events later never leaks by accident */
const toAppEvent = (event: Partial<Event>) => ({
  id: event.id,
  name: event.name,
  type: event.type,
  description: event.description ?? null,
  endDate: event.endDate ?? null,
  endDate_tz: event.endDate ? (event.endDate_tz ?? null) : null,
  location: {
    address: event.location?.address ?? null,
    booth: event.location?.booth ?? null,
    city: event.location?.city,
    coordinates: appCoordinates(event.location),
    country: event.location?.country,
    venue: event.location?.venue ?? null,
  },
  organizer: event.organizer ?? null,
  startDate: event.startDate,
  startDate_tz: event.startDate_tz,
  status: event.status,
  website: event.website ?? null,
})

/** Where the app puts the event's pin, and how precise it is */
const appCoordinates = (location: Partial<Event['location']> | undefined) => {
  const [longitude, latitude] = location?.coordinates ?? []

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null
  }

  const source = location?.coordinatesSource

  return { latitude, longitude, precision: !source || source === 'manual' ? 'exact' : source }
}

/**
 * An event without an end date lasts one day, and one whose end date has no time (00:00 in its time
 * zone) lasts until the end of that day.
 */
const isOver = ({ event, now }: { event: Partial<Event>; now: Date }) => {
  const end = event.endDate
    ? new Date(event.endDate)
    : new Date(new Date(event.startDate ?? 0).getTime() + DAY_MS)

  if (event.endDate && isMidnight({ date: end, timeZone: event.endDate_tz })) {
    end.setTime(end.getTime() + DAY_MS)
  }

  return end < now
}

const isMidnight = ({ date, timeZone }: { date: Date; timeZone?: null | string }) => {
  try {
    const time = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hourCycle: 'h23',
      minute: '2-digit',
      timeZone: timeZone || 'UTC',
    }).format(date)

    return time === '00:00'
  } catch {
    // Unknown time zone
    return false
  }
}
