/**
 * Looks up the coordinates of events in Apple Maps (README: "Event locations"), for events saved
 * before Apple Maps was set up. New and edited events are looked up when they're saved
 * (src/hooks/locateEvent.ts).
 *
 *   pnpm payload run scripts/locate-events.ts --dry-run   # only show what would be found
 *   pnpm payload run scripts/locate-events.ts             # events without coordinates
 *   pnpm payload run scripts/locate-events.ts --all       # also redo coordinates from Apple Maps
 *
 * Coordinates set by hand are never changed. On the server, deploy/locate-events.sh runs this
 * inside Docker. It stops at the first error (e.g. a wrong key, or Apple Maps' daily limit); run it
 * again later to continue (without --all, events that have coordinates are skipped).
 */
/* eslint-disable no-console -- a command-line script */
import { getPayload } from 'payload'

import { toPoint } from '../src/hooks/locateEvent'
import { isAppleMapsEnabled } from '../src/maps/appleMaps'
import { findEventLocation } from '../src/maps/findEventLocation'
import config from '../src/payload.config'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const redoAll = args.includes('--all')

if (!isAppleMapsEnabled) {
  console.error(
    'Set APPLE_MAPS_TEAM_ID, APPLE_MAPS_KEY_ID and APPLE_MAPS_PRIVATE_KEY in .env first (README: "Event locations").',
  )
  process.exit(1)
}

const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'events',
  depth: 0,
  overrideAccess: true,
  pagination: false,
  select: { name: true, location: true, startDate: true },
  sort: 'startDate',
})

const events = docs.filter(({ location }) =>
  redoAll ? location?.coordinatesSource !== 'manual' : !toPoint(location?.coordinates),
)

if (dryRun) {
  console.log('Dry run: nothing is saved.\n')
}

console.log(`Looking up ${events.length} of ${docs.length} events in Apple Maps:\n`)

let located = 0
let notFound = 0

for (const event of events) {
  const place = [event.location?.venue, event.location?.city, event.location?.country]
    .filter(Boolean)
    .join(', ')
  let result

  try {
    result = await findEventLocation(event.location ?? {})
  } catch (error) {
    console.error(`\nStopped at "${event.name}": ${(error as Error).message}`)
    console.error(`Located ${located} events before that. Run the script again to continue.`)
    process.exit(1)
  }

  if (!result) {
    notFound++
    console.log(`  not found  ${event.name}  —  ${place}`)
    continue
  }

  if (!dryRun) {
    await payload.update({
      id: event.id,
      collection: 'events',
      // This script found the coordinates already; the hook would look them up again
      context: { skipLocateEvent: true },
      data: {
        location: {
          ...event.location,
          city: event.location?.city ?? '',
          coordinates: result.coordinates,
          coordinatesSource: result.source,
          country: event.location?.country ?? '',
        },
      },
      overrideAccess: true,
    })
  }

  located++
  const [longitude, latitude] = result.coordinates
  console.log(
    `  ${result.source.padEnd(9)}  ${latitude.toFixed(5)}, ${longitude.toFixed(5)}  ${event.name}  —  ${place}  →  ${result.name}`,
  )
}

console.log(
  `\n${dryRun ? 'Would locate' : 'Located'} ${located} events; ${notFound} not found (add their coordinates by hand in the admin panel).`,
)
process.exit(0)
