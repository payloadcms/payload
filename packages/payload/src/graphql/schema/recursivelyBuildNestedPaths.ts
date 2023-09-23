import type { Payload } from '../..'
import type { FieldWithSubFields, TabsField } from '../../fields/config/types'

import { fieldAffectsData, fieldIsPresentationalOnly } from '../../fields/config/types'
import fieldToSchemaMap from './fieldToWhereInputSchemaMap'

type Args = {
  field: FieldWithSubFields | TabsField
  nestedFieldName2: string
  parentName: string
  payload: Payload
}

const recursivelyBuildNestedPaths = ({ field, nestedFieldName2, parentName, payload }: Args) => {
  const fieldName = fieldAffectsData(field) ? field.name : undefined
  const nestedFieldName = fieldName || nestedFieldName2

  if (field.type === 'tabs') {
    // if the tab has a name, treat it as a group
    // otherwise, treat it as a row
    return field.tabs.reduce((tabSchema, tab: any) => {
      tabSchema.push(
        ...recursivelyBuildNestedPaths({
          field: {
            ...tab,
            type: 'name' in tab ? 'group' : 'row',
          },
          nestedFieldName2: nestedFieldName,
          parentName,
          payload,
        }),
      )
      return tabSchema
    }, [])
  }

  const nestedPaths = field.fields.reduce((nestedFields, nestedField) => {
    if (!fieldIsPresentationalOnly(nestedField)) {
      if (!fieldAffectsData(nestedField)) {
        return [
          ...nestedFields,
          ...recursivelyBuildNestedPaths({
            field: nestedField,
            nestedFieldName2: nestedFieldName,
            parentName,
            payload,
          }),
        ]
      }

      const nestedPathName = fieldAffectsData(nestedField)
        ? `${nestedFieldName ? `${nestedFieldName}__` : ''}${nestedField.name}`
        : undefined
      const getFieldSchema = fieldToSchemaMap({
        nestedFieldName,
        parentName,
        payload,
      })[nestedField.type]

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema({
          ...nestedField,
          name: nestedPathName,
        })

        if (Array.isArray(fieldSchema)) {
          return [...nestedFields, ...fieldSchema]
        }

        return [
          ...nestedFields,
          {
            key: nestedPathName,
            type: fieldSchema,
          },
        ]
      }
    }

    return nestedFields
  }, [])

  return nestedPaths
}

export default recursivelyBuildNestedPaths
