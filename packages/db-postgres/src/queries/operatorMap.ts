import { and, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray, or } from 'drizzle-orm';

export const operatorMap = {
  // near: near,
  and,
  equals: eq,
  // TODO: isNotNull isn't right as it depends on if the query value is true or false
  exists: isNotNull,
  greater_than: gt,
  greater_than_equal: gte,
  // TODO:
  in: inArray,
  like: ilike,
  // TODO:
  // all: all,
  not_in: notInArray,
  not_equals: ne,
  exists: isNotNull,
  isNull, // handles exists: false
  equals: eq,
  // TODO: geojson queries
  // near: near,
  // within: within,
  // intersects: intersects,
  and,
  or,
}
