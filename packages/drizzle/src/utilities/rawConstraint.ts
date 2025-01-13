const RawConstraintSymbol = Symbol('RawConstraint')

/**
 * You can use this to inject a raw query to where
 */
export const rawConstraint = (value: unknown) => ({
  type: RawConstraintSymbol,
  value,
})

export const isRawConstraint = (value: unknown): value is ReturnType<typeof rawConstraint> => {
  return value && typeof value === 'object' && 'type' in value && value.type === RawConstraintSymbol
}
