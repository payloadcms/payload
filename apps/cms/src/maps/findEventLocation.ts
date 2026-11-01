import type { Coordinate, Place } from './appleMaps'

import { geocode, isAppleMapsEnabled, search } from './appleMaps'

export type EventPlace = {
  address?: null | string
  city?: null | string
  country?: null | string
  venue?: null | string
}

/** How precise the coordinates are: the same values as `location.coordinatesSource` of Events */
export type LocationSource = 'address' | 'city' | 'country' | 'venue'

export type FoundLocation = {
  /** [longitude, latitude], the order of Payload's point fields */
  coordinates: [number, number]
  /** What Apple Maps found, e.g. "Hong Kong Convention and Exhibition Centre" */
  name: string
  source: LocationSource
}

/** A venue or address further than this from the city's center is taken for a namesake elsewhere */
const MAX_DISTANCE_KM = 100

/**
 * Finds an event's place in Apple Maps, most precise first, like the app's own lookup
 * (EventLocator.swift in VgemsAI):
 * 1. the venue, e.g. "Palexpo, Geneva, Switzerland", among points of interest
 * 2. the street address with the city and country, when Apple Maps knows the street
 * 3. only the city and country, or only the country when the city isn't known yet
 *
 * The city is looked up first: searches prefer places near it, and a venue or address found far
 * away from it is ignored. Empty values and placeholders such as "TBC" (to be confirmed), which the
 * events import uses, count as unknown.
 *
 * Returns undefined when Apple Maps isn't set up and null when nothing was found. Throws when Apple
 * Maps can't be reached or refuses the call.
 */
export async function findEventLocation(
  place: EventPlace,
): Promise<FoundLocation | null | undefined> {
  if (!isAppleMapsEnabled) {
    return undefined
  }

  const city = known(place.city)
  const country = known(place.country)
  // "Hong Kong, Hong Kong" is just "Hong Kong"
  const area = [city, country].filter(
    (value, index, all): value is string =>
      Boolean(value) &&
      all.findIndex((other) => other?.toLowerCase() === value?.toLowerCase()) === index,
  )

  const [areaPlace] = area.length > 0 ? await geocode({ q: area.join(', ') }) : []
  const center = areaPlace?.coordinate
  // Only a city is small enough to check against; a country's center says little
  const isNearby = (coordinate: Coordinate) =>
    !center || !city || distanceKm(center, coordinate) <= MAX_DISTANCE_KM

  const venue = known(place.venue)

  if (venue) {
    const [poi] = await search({
      q: [venue, ...area].join(', '),
      resultTypeFilter: 'Poi',
      searchLocation: center,
    })

    if (poi && isNearby(poi.coordinate)) {
      return found(poi, 'venue')
    }
  }

  const address = known(place.address)

  if (address) {
    const [match] = await geocode({ q: [address, ...area].join(', '), searchLocation: center })

    // Without a street, Apple Maps only found the city or the area around it
    if (match?.structuredAddress?.thoroughfare && isNearby(match.coordinate)) {
      return found(match, 'address')
    }
  }

  if (areaPlace) {
    return found(areaPlace, city ? 'city' : 'country')
  }

  return null
}

/** Null for empty values and placeholders such as "TBC" (to be confirmed) */
export const known = (value: null | string | undefined) => {
  const text = value?.trim()

  return text && !/\bTBC\b/i.test(text) ? text : null
}

const found = (place: Place, source: LocationSource): FoundLocation => ({
  coordinates: [place.coordinate.longitude, place.coordinate.latitude],
  name: place.name || place.formattedAddressLines?.join(', ') || '',
  source,
})

/** Great-circle distance */
function distanceKm(a: Coordinate, b: Coordinate) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2

  return 2 * 6371 * Math.asin(Math.sqrt(h))
}
