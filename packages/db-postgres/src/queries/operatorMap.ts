import { and, eq, gt, gte, inArray, isNotNull, lt, lte, ne, notInArray, or } from 'drizzle-orm'

export const operatorMap: any = {
  // near: near,
  and,
  equals: eq,
  // TODO: isNotNull isn't right as it depends on if the query value is true or false
  exists: isNotNull,
  greater_than: gt,
  greater_than_equal: gte,
  // TODO:
  in: inArray,
  less_than: lt,
  less_than_equal: lte,
  not_equals: ne,
  // TODO:
  // all: all,
  not_in: notInArray,
  or,
}
