import { and, eq, gt, gte, ilike, inArray, isNotNull, lt, lte, ne, notInArray, or } from 'drizzle-orm';

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
  // TODO: isNotNull isn't right as it depends on if the query value is true or false
  exists: isNotNull,
  equals: eq,
  // TODO:
  // near: near,
  and,
  or,
};
