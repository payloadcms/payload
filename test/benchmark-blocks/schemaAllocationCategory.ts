export type SchemaAllocationCategory =
  | 'array-group-tab'
  | 'blocks-base'
  | 'discriminator-clone'
  | 'mongoose-internal'
  | 'top-level'

const schemaAllocationCategories: SchemaAllocationCategory[] = [
  'top-level',
  'blocks-base',
  'discriminator-clone',
  'array-group-tab',
  'mongoose-internal',
]

export const classifySchemaAllocation = ({
  stack,
}: {
  stack?: string
}): SchemaAllocationCategory => {
  if (!stack) {
    return 'mongoose-internal'
  }

  if (/\bat (?:array|group|tabs)\b/.test(stack)) {
    return 'array-group-tab'
  }

  if (/\bat blocks\b/.test(stack)) {
    return 'blocks-base'
  }

  if (stack.includes('/models/buildSchema.')) {
    return 'top-level'
  }

  return 'mongoose-internal'
}

export const createSchemaAllocationCounts = (): Record<SchemaAllocationCategory, number> =>
  Object.fromEntries(schemaAllocationCategories.map((category) => [category, 0])) as Record<
    SchemaAllocationCategory,
    number
  >
