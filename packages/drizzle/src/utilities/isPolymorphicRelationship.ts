import type { CollectionSlug } from 'payload'

export const isPolymorphicRelationship = (
  value: unknown,
): value is {
  relationTo: CollectionSlug
  value: number | string
} => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'relationTo' in value &&
      typeof value.relationTo === 'string' &&
      'value' in value,
  )
}
