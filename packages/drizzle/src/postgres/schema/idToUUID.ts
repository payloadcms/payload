import type { FlattenField } from 'payload'

export const idToUUID = (fields: FlattenField[]): FlattenField[] =>
  fields.map((field) => {
    if ('name' in field && field.name === 'id') {
      return {
        ...field,
        name: '_uuid',
      }
    }

    return field
  })
