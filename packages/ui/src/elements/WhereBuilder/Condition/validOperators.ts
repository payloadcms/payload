import type { Operator } from 'payload'

export const getOperatorValueTypes = (fieldType) => {
  return {
    all: 'any',
    contains: 'string',
    equals: 'any',
    /*
     * exists:
     * The expected value is boolean, but it's passed as a string ('true' or 'false').
     * Need to additionally check if the value is strictly 'true' or 'false' as a string,
     * rather than using a direct typeof comparison.
     * This is handled as:
     * validOperatorValue === 'boolean' && (value === 'true' || value === 'false')
     */
    exists: 'boolean',
    /*
     * greater_than, greater_than_equal, less_than, less_than_equal:
     * Used for number and date fields:
     * - For date fields, the value is an object (e.g., Mon Feb 17 2025 12:00:00 GMT+0000).
     * - For number fields, the value is a string representing the number.
     */
    greater_than: fieldType === 'date' ? 'object' : 'string',
    greater_than_equal: fieldType === 'date' ? 'object' : 'string',
    in: 'any',
    intersects: 'any',
    less_than: fieldType === 'date' ? 'object' : 'string',
    less_than_equal: fieldType === 'date' ? 'object' : 'string',
    like: 'string',
    near: 'any',
    not_equals: 'any',
    not_in: 'any',
    not_like: 'string',
    within: 'any',
  }
}

/**
 * Determines whether the current condition value should be reset when switching operators.
 *
 * A value produced by `exists` is always the string 'true'/'false'. It counts as a valid
 * value for 'any'-typed operators like `equals`, but on e.g. a relationship field it is
 * cast to NaN server-side and crashes the query — so it never carries over to another operator.
 */
export const shouldResetValueOnOperatorChange = ({
  fieldType,
  newOperator,
  previousOperator,
  value,
}: {
  fieldType?: string
  newOperator: Operator
  previousOperator: Operator
  value: unknown
}): boolean => {
  const operatorValueTypes = getOperatorValueTypes(fieldType)
  const validOperatorValue = operatorValueTypes[newOperator] || 'any'
  const isValidValue =
    validOperatorValue === 'any' ||
    typeof value === validOperatorValue ||
    (validOperatorValue === 'boolean' && (value === 'true' || value === 'false'))

  const isStaleExistsValue = previousOperator === 'exists' && newOperator !== 'exists'

  return !isValidValue || isStaleExistsValue
}
