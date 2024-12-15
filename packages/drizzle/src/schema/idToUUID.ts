import type { FlattenedField } from 'payload'

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
