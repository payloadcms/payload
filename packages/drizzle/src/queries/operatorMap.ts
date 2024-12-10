import {
  and,
  type Column,
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
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm'

type OperatorKeys =
  | 'and'
  | 'contains'
  | 'equals'
  | 'exists'
  | 'greater_than'
  | 'greater_than_equal'
  | 'in'
  | 'isNull'
  | 'less_than'
  | 'less_than_equal'
  | 'like'
  | 'not_equals'
  | 'not_in'
  | 'or'

export type Operators = Record<OperatorKeys, (column: Column, value: SQLWrapper | unknown) => SQL>

export const operatorMap: Operators = {
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
  // all: all,
  not_in: notInArray,
  or,
}
