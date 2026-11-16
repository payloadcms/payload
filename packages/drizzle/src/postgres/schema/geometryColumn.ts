import { geometry } from 'drizzle-orm/pg-core'

/**
 * Point geometry column.
 *
 * drizzle-kit v1's rewritten introspection recognizes `geometry(point)` as its native
 * PostGIS geometry type, so the previous `customType` implementation (which lacked the
 * native `mode`/`srid` config) broke `push`/introspection with "unknown geometry type".
 * The native `geometry` builder in tuple mode round-trips `[x, y]` tuples and is understood
 * by drizzle-kit.
 */
export const geometryColumn = (name: string) =>
  geometry(name, { type: 'point', mode: 'tuple', srid: 4326 })
