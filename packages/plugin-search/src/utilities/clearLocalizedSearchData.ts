import type { FlattenedBlock, FlattenedField } from 'payload'

export const clearLocalizedSearchData = ({
  blocks,
  data,
  fields,
  locale,
  shouldClearAllFields = false,
}: {
  blocks: FlattenedBlock[]
  data: Record<string, any>
  fields: FlattenedField[]
  locale: string
  shouldClearAllFields?: boolean
}): Record<string, any> => {
  const clearedData: Record<string, any> = {}

  for (const field of fields) {
    if (!('name' in field)) {
      continue
    }

    const value = data[field.name]

    if (field.localized || shouldClearAllFields) {
      const clearedValue =
        field.type === 'group' || field.type === 'tab'
          ? clearLocalizedSearchData({
              blocks,
              data: (field.localized ? value?.[locale] : value) || {},
              fields: field.flattenedFields,
              locale,
              shouldClearAllFields: true,
            })
          : field.type === 'array' ||
              field.type === 'blocks' ||
              ('hasMany' in field && field.hasMany)
            ? []
            : null

      clearedData[field.name] = field.localized
        ? { ...value, [locale]: clearedValue }
        : clearedValue
    } else if ('flattenedFields' in field && value) {
      if (field.type === 'array') {
        clearedData[field.name] = value.map((row: Record<string, any>) => ({
          ...row,
          ...clearLocalizedSearchData({ blocks, data: row, fields: field.flattenedFields, locale }),
        }))
      } else {
        clearedData[field.name] = {
          ...value,
          ...clearLocalizedSearchData({
            blocks,
            data: value,
            fields: field.flattenedFields,
            locale,
          }),
        }
      }
    } else if (field.type === 'blocks' && Array.isArray(value)) {
      clearedData[field.name] = value.map((row: Record<string, any>) => {
        const block =
          field.blocks.find((block) => typeof block !== 'string' && block.slug === row.blockType) ??
          blocks.find((block) => block.slug === row.blockType)

        return typeof block === 'object'
          ? {
              ...row,
              ...clearLocalizedSearchData({
                blocks,
                data: row,
                fields: block.flattenedFields,
                locale,
              }),
            }
          : row
      })
    }
  }

  return clearedData
}
