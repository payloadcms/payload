import { and, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray, or } from 'drizzle-orm';

export const operatorMap = {
  greater_than_equal: gte,
  less_than_equal: lte,
  less_than: lt,
  greater_than: gt,
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
};
