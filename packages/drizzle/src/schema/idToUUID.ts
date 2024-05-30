import type { Field } from 'payload/types'

export const idToUUID = (fields: Field[]): Field[] =>
  fields.map((field) => {
    if ('name' in field && field.name === 'id') {
      return {
        ...field,
        name: '_uuid',
      }
    }

    return field
  })
