import React, { Fragment } from 'react'

import type { FieldPermissions } from 'payload/auth'
import type { Description, Field, FieldWithPath } from 'payload/types'
import DefaultError from '../Error'
import DefaultLabel from '../Label'
import DefaultDescription from '../FieldDescription'
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/types'
import { fieldTypes } from '../field-types'

type FieldComponentProps = {
  Error: React.ReactNode
  Label: React.ReactNode
  BeforeInput: React.ReactNode
  AfterInput: React.ReactNode
}
export function isComponent(description: Description): boolean {
  return React.isValidElement(description)
}

export type ReducedField = {
  Field: React.ReactNode
  fieldIsPresentational: boolean
  fieldPermissions: FieldPermissions
  isFieldAffectingData: boolean
  name: string
  readOnly: boolean
  isSidebar: boolean
}

export const createFieldMap = (args: {
  fieldSchema: FieldWithPath[]
  filter?: (field: Field) => boolean
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
    filter,
    operation = 'update',
    permissions,
    readOnly: readOnlyOverride,
  } = args

  return fieldSchema.reduce((acc, field): ReducedField[] => {
    // if (!acc) console.log('acc is undefined', field)
    const fieldIsPresentational = fieldIsPresentationalOnly(field)
    let FieldComponent = field.admin?.components?.Field || fieldTypes[field.type]

    if (fieldIsPresentational || (!field?.hidden && field?.admin?.disabled !== true)) {
      if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
        if (field.admin && 'hidden' in field.admin && field?.admin?.hidden) {
          FieldComponent = fieldTypes.hidden
        }

        const isFieldAffectingData = fieldAffectsData(field)
        const fieldPermissions = isFieldAffectingData ? permissions?.[field.name] : permissions

        // if the user cannot read the field, then filter it out
        // if (fieldPermissions?.read?.permission === false) {
        //   return acc
        // }

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

        const LabelComponent =
          (field.admin?.components &&
            'Label' in field.admin.components &&
            field.admin?.components?.Label) ||
          DefaultLabel

        const Label = (
          <LabelComponent
            htmlFor="TODO"
            label={'label' in field ? field.label : null}
            required={'required' in field ? field.required : undefined}
          />
        )

        const ErrorComponent =
          (field.admin?.components &&
            'Error' in field.admin.components &&
            field.admin?.components?.Error) ||
          DefaultError

        const Error = <ErrorComponent />

        const DescriptionComponent =
          ('description' in field.admin &&
            field.admin.description &&
            isComponent(field.admin.description) &&
            (field.admin.description as React.FC<any>)) ||
          DefaultDescription

        const Description = (
          <DescriptionComponent
            description={
              'description' in field.admin && typeof field.admin?.description === 'string'
                ? field.admin.description
                : undefined
            }
          />
        )

        const BeforeInput = field.admin?.components &&
          'beforeInput' in field.admin?.components &&
          Array.isArray(field.admin.components.beforeInput) && (
            <Fragment>
              {field.admin.components.beforeInput.map((Component, i) => (
                <Component key={i} />
              ))}
            </Fragment>
          )

        const AfterInput = 'components' in field.admin &&
          'afterInput' in field.admin.components &&
          Array.isArray(field.admin.components.afterInput) && (
            <Fragment>
              {field.admin.components.afterInput.map((Component, i) => (
                <Component key={i} />
              ))}
            </Fragment>
          )

        // Group, Array, Tabs, and Collapsible fields have nested fields
        const nestedFieldMap =
          'fields' in field &&
          field.fields &&
          Array.isArray(field.fields) &&
          createFieldMap({
            fieldSchema: field.fields,
            filter,
            operation,
            permissions,
            readOnly: readOnlyOverride,
          })

        const Field = (
          <FieldComponent
            Error={Error}
            Label={Label}
            BeforeInput={BeforeInput}
            AfterInput={AfterInput}
            Description={Description}
            fieldMap={nestedFieldMap}
            className={'className' in field.admin ? field?.admin?.className : undefined}
            style={'style' in field.admin ? field?.admin?.style : undefined}
            width={'width' in field.admin ? field?.admin?.width : undefined}
            label={'label' in field ? field.label : undefined}
          />
        )

        const reducedField: ReducedField = {
          name: 'name' in field ? field.name : '',
          Field,
          fieldIsPresentational,
          fieldPermissions,
          isFieldAffectingData,
          readOnly,
          isSidebar: field.admin?.position === 'sidebar',
        }

        if (FieldComponent) {
          acc.push(reducedField)
        }
      }
    }
  }, [])
}
