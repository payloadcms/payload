import { operatorMap as defaultOperators, type Operators } from '@payloadcms/drizzle'
import { like, notLike } from 'drizzle-orm'

export const operatorMap: Operators = {
  ...defaultOperators,
  // sqlite's like operator is case-insensitive, so we overwrite the DrizzleAdapter operators to not use ilike
  contains: like,
  like,
  not_like: notLike,
  // libsql converts Date parameters to integers; we wrap the comparison operators to convert these
  // to the ISO 8601 string representation which matches our generated schema.
  equals: withISODateConversion(defaultOperators.equals),
  greater_than: withISODateConversion(defaultOperators.greater_than),
  greater_than_equal: withISODateConversion(defaultOperators.greater_than_equal),
  less_than: withISODateConversion(defaultOperators.less_than),
  less_than_equal: withISODateConversion(defaultOperators.less_than_equal),
  not_equals: withISODateConversion(defaultOperators.not_equals),
  in: withISODateConversion(defaultOperators.in),
  not_in: withISODateConversion(defaultOperators.not_in),
}

function withISODateConversion(op: Operators[keyof Operators]): Operators[keyof Operators] {
  return (left, right) => {
    if (right instanceof Date) {
      right = right.toISOString()
    } else if (Array.isArray(right)) {
      right = right.map((item) => item instanceof Date ? item.toISOString() : item)
    }
    return op(left, right)
  }
}
