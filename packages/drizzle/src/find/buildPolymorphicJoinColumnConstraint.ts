import type { Column, SQL } from 'drizzle-orm'
import type { FlattenedField } from 'payload'

import { and, isNotNull, isNull, or } from 'drizzle-orm'
import { QueryError } from 'payload'

import type { DrizzleAdapter } from '../types.js'

import { sanitizeQueryValue } from '../queries/sanitizeQueryValue.js'

type BuildPolymorphicJoinColumnConstraintArgs = {
  adapter: DrizzleAdapter
  column: Column
  /** Reported by the thrown `QueryError`, e.g. `title.equals`. */
  errorPath: string
  field: FlattenedField
  isUUID: boolean
  operator: string
  /** Schema path of the constraint, used by value sanitization to detect relationTo paths. */
  schemaPath: string
  value: unknown
}

/**
 * Compiles one operator against a single column, applying the same value sanitization and null
 * handling the non-polymorphic query path uses. Shared by the scalar branch and by the leaf of a
 * localized or separate-row chain so both agree on operator semantics.
 *
 * @throws {QueryError} When the value cannot be sanitized or the operator is not supported.
 */
export const buildPolymorphicJoinColumnConstraint = ({
  adapter,
  column,
  errorPath,
  field,
  isUUID,
  operator: incomingOperator,
  schemaPath,
  value: incomingValue,
}: BuildPolymorphicJoinColumnConstraintArgs): SQL => {
  const originalOperator = incomingOperator
  let payloadOperator = incomingOperator
  let value = incomingValue

  if (
    payloadOperator === 'like' &&
    (field.type === 'number' || field.type === 'relationship' || field.type === 'upload' || isUUID)
  ) {
    payloadOperator = 'equals'
  }

  const sanitizedQueryValue = sanitizeQueryValue({
    adapter,
    field,
    isUUID,
    operator: payloadOperator,
    relationOrPath: schemaPath,
    val: value,
  })

  if (sanitizedQueryValue === null || sanitizedQueryValue.columns) {
    throw new QueryError([{ path: errorPath }])
  }

  payloadOperator = sanitizedQueryValue.operator
  value = sanitizedQueryValue.value

  if (!(payloadOperator in adapter.operators)) {
    throw new QueryError([{ path: errorPath }])
  }

  const operator = adapter.operators[payloadOperator as keyof typeof adapter.operators]

  if (originalOperator === 'equals' && value === null) {
    return isNull(column)
  }

  if (originalOperator === 'not_equals') {
    if (value === null) {
      return isNotNull(column)
    }

    return or(isNull(column), operator(column, value))
  }

  if (originalOperator === 'in' && Array.isArray(value) && value.includes(null)) {
    const nonNullValues = value.filter((item) => item !== null)

    if (!nonNullValues.length) {
      return isNull(column)
    }

    return or(isNull(column), operator(column, nonNullValues))
  }

  if (payloadOperator === 'like' && typeof value === 'string') {
    return and(...value.split(' ').map((word) => operator(column, `%${word}%`)))
  }

  return operator(column, value)
}
