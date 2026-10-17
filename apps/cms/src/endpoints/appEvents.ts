import type { Endpoint, Where } from 'payload'

import crypto from 'node:crypto'

import type { Event } from '../payload-types'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * `GET /api/app/events` - upcoming events from the private Events collection (under "Business") for
 * the VgemsAI app's backend (awoz-api), which passes them on to the app.
 *
 * Server to server only: the caller sends `X-API-Key: <APP_API_KEY>`. While APP_API_KEY is empty the
 * endpoint answers 404, as if it didn't exist. It uses an API key instead of a login because every
 * login must pass two-factor (src/proxy.ts), which a server can't do.
 *
 * Only fields that are safe to show app users leave the CMS: never clients, notes or attachments.
 * "Upcoming" means not over yet (still running, or starting later) and starting within the next 12
 * months. Cancelled events are left out. Soonest first, in the same `{ docs: [...] }` shape as
 * Payload's REST API.
 */
export const appEventsEndpoint: Endpoint = {
  handler: async (req) => {
    const apiKey = process.env.APP_API_KEY

    if (!apiKey) {
      return Response.json({ errors: [{ message: 'Not Found' }] }, { status: 404 })
    }

    if (!isSameSecret(req.headers.get('x-api-key') ?? '', apiKey)) {
      return Response.json({ errors: [{ message: 'Invalid API key.' }] }, { status: 401 })
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
            { endDate: { greater_than_equal: now.toISOString() } },
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
    country: event.location?.country,
    venue: event.location?.venue ?? null,
  },
  organizer: event.organizer ?? null,
  startDate: event.startDate,
  startDate_tz: event.startDate_tz,
  status: event.status,
  website: event.website ?? null,
})

/** An event without an end date lasts one day */
const isOver = ({ event, now }: { event: Partial<Event>; now: Date }) => {
  const end = event.endDate
    ? new Date(event.endDate)
    : new Date(new Date(event.startDate ?? 0).getTime() + DAY_MS)

  return end < now
}

/** Constant-time comparison; hashing first makes both sides the same length */
const isSameSecret = (given: string, expected: string) =>
  crypto.timingSafeEqual(
    crypto.createHash('sha256').update(given).digest(),
    crypto.createHash('sha256').update(expected).digest(),
  )
