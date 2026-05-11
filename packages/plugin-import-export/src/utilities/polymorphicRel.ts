export type PolymorphicRelValue = {
  relationTo: string
  value: { id: number | string } | number | string
}

export const isPolymorphicRelValue = (v: unknown): v is PolymorphicRelValue =>
  typeof v === 'object' && v !== null && 'relationTo' in v && 'value' in v

/**
 * Returns the id of a populated polymorphic relationship value, or `undefined`
 * if the inner value is missing. Handles both depth=0 (`value` is the bare id)
 * and depth>=1 (`value` is the populated doc).
 */
export const getPolymorphicRelId = (v: PolymorphicRelValue): number | string | undefined => {
  const inner = v.value
  if (inner == null) {
    return undefined
  }
  if (typeof inner === 'object') {
    return (inner as { id?: number | string }).id
  }
  return inner
}
