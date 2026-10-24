import type { CollectionBeforeChangeHook } from 'payload'

import type { Event } from '../payload-types'

import { findEventLocation } from '../maps/findEventLocation'

type Location = Partial<Event['location']>
type Point = [number, number]

/**
 * Puts events on the map: fills in `location.coordinates` from Apple Maps (../maps) when an event
 * is created, when its venue, address, city or country changes, and when it has no coordinates
 * yet. `location.coordinatesSource` says how precise they are (venue, street address, only the city
 * or country, or set by hand).
 *
 * - Coordinates changed in the admin panel are kept and marked "Set by hand". Clearing them looks
 *   the place up again.
 * - A changed place is looked up again, even over coordinates set by hand, unless the coordinates
 *   change in the same save.
 * - When a changed place isn't found, or Apple Maps isn't set up or can't be reached, the old
 *   coordinates are removed instead of pointing at the old place.
 * - Nothing here stops a save.
 *
 * Skipped with `context: { skipLocateEvent: true }`: scripts/locate-events.ts saves what it found
 * itself.
 */
export const locateEvent: CollectionBeforeChangeHook = async ({
  context,
  data,
  operation,
  originalDoc,
  req,
}) => {
  const input = data.location as Location | undefined

  // The admin panel sends [null, null] for empty coordinates, which MongoDB can't index
  if (input && input.coordinates !== undefined) {
    input.coordinates = toPoint(input.coordinates)
  }

  if (context.skipLocateEvent) {
    return data
  }

  const before = (originalDoc as Event | undefined)?.location
  // A partial update may send only some of the location's fields
  const location: Location = { ...before, ...input }
  const coordinates = toPoint(location.coordinates)
  const editedByHand =
    input?.coordinates !== undefined && !isSamePoint(coordinates, toPoint(before?.coordinates))

  if (editedByHand && coordinates) {
    data.location = { ...location, coordinates, coordinatesSource: 'manual' }
    return data
  }

  const placeChanged = operation === 'create' || placeKey(location) !== placeKey(before)

  if (!placeChanged && !editedByHand && coordinates) {
    return data
  }

  const found = await findEventLocation(location).catch((error: unknown) => {
    req.payload.logger.warn({
      err: error,
      msg: `Could not look up the place of the event "${data.name ?? originalDoc?.name}" in Apple Maps; saving it without new coordinates`,
    })
    return undefined
  })

  if (found) {
    data.location = { ...location, coordinates: found.coordinates, coordinatesSource: found.source }
  } else if (placeChanged || editedByHand) {
    data.location = { ...location, coordinates: null, coordinatesSource: null }
  }

  return data
}

/** [longitude, latitude], or null unless both are numbers */
export const toPoint = (value: unknown): null | Point => {
  const pair = Array.isArray(value)
    ? value
    : (value as { coordinates?: unknown } | null)?.coordinates

  if (
    !Array.isArray(pair) ||
    pair.length !== 2 ||
    pair.some((part) => part === null || part === '')
  ) {
    return null
  }

  const [longitude, latitude] = pair.map(Number)

  return Number.isFinite(longitude) && Number.isFinite(latitude) ? [longitude, latitude] : null
}

const isSamePoint = (a: null | Point, b: null | Point) =>
  a === null || b === null ? a === b : Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9

const placeKey = (location: Location | undefined) =>
  [location?.venue, location?.address, location?.city, location?.country]
    .map((value) => value?.trim().toLowerCase() ?? '')
    .join('|')
