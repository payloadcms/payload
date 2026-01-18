import type { FlattenedField } from '@ruya.sa/payload'

export const idToUUID = (fields: FlattenedField[]): FlattenedField[] =>
  fields.map((field) => {
    if ('name' in field && field.name === 'id') {
      return {
        ...field,
        name: '_uuid',
      }
    }

    return field
  })
