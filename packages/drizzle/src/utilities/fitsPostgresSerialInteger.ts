const postgresSerialIntegerMin = -2147483648
const postgresSerialIntegerMax = 2147483647

/**
 * True when a query value can be bound to a Postgres serial `integer` (int4) column.
 * Numeric strings that fit still match serial IDs. Strings outside this range overflow.
 */
export const fitsPostgresSerialInteger = (val: unknown): boolean => {
  if (typeof val === 'number') {
    return (
      Number.isInteger(val) && val >= postgresSerialIntegerMin && val <= postgresSerialIntegerMax
    )
  }

  if (typeof val !== 'string' || !/^-?\d+$/.test(val)) {
    return false
  }

  const asBigInt = BigInt(val)
  return (
    asBigInt >= BigInt(postgresSerialIntegerMin) && asBigInt <= BigInt(postgresSerialIntegerMax)
  )
}

/** True when sanitizing this value would bind it as an integer rather than dropping it as NaN. */
export const bindsAsPostgresInteger = (val: unknown): boolean => {
  if (typeof val === 'number') {
    return Number.isInteger(val)
  }

  return typeof val === 'string' && /^-?\d+$/.test(val)
}
