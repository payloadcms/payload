import type React from 'react'

import type { FieldPermissions } from '../../../../auth'
import type { Field, FieldWithPath } from '../../../../exports/types'
import type { FieldTypes } from '../field-types'

import { fieldAffectsData, fieldIsPresentationalOnly } from '../../../../exports/types'

export type ReducedField = {
  FieldComponent: React.ComponentType<any>
  field: FieldWithPath
  fieldIsPresentational: boolean
  fieldPermissions: FieldPermissions
  isFieldAffectingData: boolean
  name: string
  readOnly: boolean
}

export const filterFields = (args: {
  fieldSchema: FieldWithPath[]
  fieldTypes: FieldTypes
  filter: (field: Field) => boolean
  operation?: 'create' | 'update'
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
}): ReducedField[] => {
  const {
    fieldSchema,
    fieldTypes,
    filter,
    operation,
    permissions,
    readOnly: readOnlyOverride,
  } = args

  return fieldSchema.reduce((acc, field): ReducedField[] => {
    const fieldIsPresentational = fieldIsPresentationalOnly(field)
    let FieldComponent = fieldTypes[field.type]

    if (fieldIsPresentational || (!field?.hidden && field?.admin?.disabled !== true)) {
      if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
        if (field.admin && 'hidden' in field.admin && field?.admin?.hidden) {
          FieldComponent = fieldTypes.hidden
        }

        const isFieldAffectingData = fieldAffectsData(field)
        const fieldPermissions = isFieldAffectingData ? permissions?.[field.name] : permissions

        // if the user cannot read the field, then filter it out
        if (fieldPermissions?.read?.permission === false) {
          return acc
        }

        // readOnly from field config
        let readOnly = field.admin && 'readOnly' in field.admin ? field.admin.readOnly : undefined

        // if parent field is readOnly
        // but this field is `readOnly: false`
        // the field should be editable
        if (readOnlyOverride && readOnly !== false) readOnly = true

        // unless the user does not pass access control
        if (fieldPermissions?.[operation]?.permission === false) {
          readOnly = true
        }

        if (FieldComponent) {
          acc.push({
            name: 'name' in field ? field.name : '',
            FieldComponent,
            field,
            fieldIsPresentational,
            fieldPermissions,
            isFieldAffectingData,
            readOnly,
          })
        }
      }
    }

    return acc
  }, [])
}
