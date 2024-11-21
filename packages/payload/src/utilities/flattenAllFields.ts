import type { Field, FlattenedField } from '../fields/config/types.js'

import { tabHasName } from '../fields/config/types.js'

export const flattenAllFields = ({ fields }: { fields: Field[] }): FlattenedField[] => {
  const result: FlattenedField[] = []

  for (const field of fields) {
    switch (field.type) {
      case 'array':
      case 'group': {
        result.push({ ...field, flattenedFields: flattenAllFields({ fields: field.fields }) })
        break
      }

      case 'blocks': {
        const blocks = []
        for (const block of field.blocks) {
          blocks.push({
            ...block,
            flattenedFields: flattenAllFields({ fields: block.fields }),
          })
        }
        result.push({
          ...field,
          blocks,
        })
        break
      }

      case 'collapsible':
      case 'row': {
        for (const nestedField of flattenAllFields({ fields: field.fields })) {
          result.push(nestedField)
        }
        break
      }

      case 'tabs': {
        for (const tab of field.tabs) {
          if (!tabHasName(tab)) {
            for (const nestedField of flattenAllFields({ fields: tab.fields })) {
              result.push(nestedField)
            }
          } else {
            result.push({
              ...tab,
              type: 'tab',
              flattenedFields: flattenAllFields({ fields: tab.fields }),
            })
          }
        }
        break
      }

      default: {
        if (field.type !== 'ui') {
          result.push(field)
        }
      }
    }
  }

  return result
}
