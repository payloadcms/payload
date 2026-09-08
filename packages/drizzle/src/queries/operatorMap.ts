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
  notIlike,
  notInArray,
  or,
  type SQL,
} from 'drizzle-orm'

export type OperatorKeys =
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
  | 'not_like'
  | 'or'

/**
 * The subset of operator keys that represent an actual user-facing comparison operator,
 * excluding the `and`/`or` boolean combinators.
 */
export type DrizzleResolvedOperator = Exclude<OperatorKeys, 'and' | 'or'>

export type Operators = Record<OperatorKeys, (column: Column | SQL, value: unknown) => SQL>

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
  not_like: notIlike,
  // TODO: support this
  // all: all,
  not_in: notInArray,
  or,
}
