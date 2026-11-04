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
     * - For date fields, the value can be a Date or a semantic calendar-date string.
     * - For number fields, the value is a string representing the number.
     */
    greater_than: fieldType === 'date' ? 'any' : 'string',
    greater_than_equal: fieldType === 'date' ? 'any' : 'string',
    in: 'any',
    intersects: 'any',
    less_than: fieldType === 'date' ? 'any' : 'string',
    less_than_equal: fieldType === 'date' ? 'any' : 'string',
    like: 'string',
    near: 'any',
    not_equals: 'any',
    not_in: 'any',
    not_like: 'string',
    within: 'any',
  }
}
