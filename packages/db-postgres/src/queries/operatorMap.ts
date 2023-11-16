import {
  and,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notInArray,
  or,
} from 'drizzle-orm'

export const operatorMap = {
  // intersects: intersects,
  and,
  contains: ilike,
  equals: eq,
  exists: isNotNull,
  greater_than: gt,
  greater_than_equal: gte,
  in: inArray,
  isNull, // handles exists: false
  less_than: lt,
  less_than_equal: lte,
  like: ilike,
  not_equals: ne,
  // TODO: geojson queries
  // near: near,
  // within: within,
  // all: all,
  not_in: notInArray,
  or,
}
