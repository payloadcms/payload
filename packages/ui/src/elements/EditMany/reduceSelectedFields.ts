import type { ClientField } from 'payload'

import { fieldHasSubFields } from 'payload/shared'

import type { SelectedField } from '../FieldSelect/reduceFieldOptions.js'

import { ignoreFromBulkEdit } from '../FieldSelect/reduceFieldOptions.js'

export const reduceSelectedFields = (
  fields: ClientField[],
  selectedFields: SelectedField[],
): ClientField[] =>
  fields.reduce((acc, field) => {
    console.log('field', field, selectedFields)

    if (ignoreFromBulkEdit(field)) {
      return acc
    }

    const isFieldSelected = selectedFields.some(
      ({ path }) => 'name' in field && path.split('.')?.[0] === field.name,
    )

    if (isFieldSelected) {
      if (fieldHasSubFields(field)) {
        const allButFirstSegments: SelectedField[] = selectedFields.map((selectedField) => ({
          ...selectedField,
          path: selectedField.path.split('.').slice(1).join('.'),
        }))

        acc.push({
          ...field,
          fields: reduceSelectedFields(field.fields, allButFirstSegments),
        })
      } else {
        acc.push(field)
      }
    }

    return acc
  }, [] as ClientField[])
