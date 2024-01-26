import React, { Fragment } from 'react'

import type { FieldPermissions } from 'payload/auth'
import type { Field, FieldWithPath, TabsField } from 'payload/types'
import DefaultError from '../Error'
import DefaultLabel from '../Label'
import DefaultDescription from '../FieldDescription'
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/types'
import { fieldTypes } from '../field-types'
import { FormFieldBase } from '../field-types/shared'

export type ReducedField = {
  type: keyof typeof fieldTypes
  Field: React.ReactNode
  fieldIsPresentational: boolean
  fieldPermissions: FieldPermissions
  isFieldAffectingData: boolean
  name: string
  readOnly: boolean
  isSidebar: boolean
  subfields?: ReducedField[]
  tabs?: ReducedTab[]
}

export type ReducedTab = {
  name?: string
  label: TabsField['tabs'][0]['label']
  subfields?: ReducedField[]
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
  parentPath?: string
}): ReducedField[] => {
  const {
    fieldSchema,
    filter,
    operation = 'update',
    permissions,
    readOnly: readOnlyOverride,
    parentPath,
  } = args

  return fieldSchema.reduce((acc, field): ReducedField[] => {
    const fieldIsPresentational = fieldIsPresentationalOnly(field)
    let FieldComponent = field.admin?.components?.Field || fieldTypes[field.type]

    if (fieldIsPresentational || (!field?.hidden && field?.admin?.disabled !== true)) {
      if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
        if (field.admin && 'hidden' in field.admin && field?.admin?.hidden) {
          FieldComponent = fieldTypes.hidden
        }

        const isFieldAffectingData = fieldAffectsData(field)

        const path = `${parentPath ? `${parentPath}.` : ''}${
          field.path || (isFieldAffectingData && 'name' in field ? field.name : '')
        }`

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

        const LabelComponent =
          (field.admin?.components &&
            'Label' in field.admin.components &&
            field.admin?.components?.Label) ||
          DefaultLabel

        // TODO: fix this for basic function types, i.e. not React.ComponentType
        const Label = (
          <LabelComponent
            htmlFor="TODO"
            // TODO: fix types
            // @ts-ignore-next-line
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
            typeof field.admin.description === 'function' &&
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

        // Group, Array, and Collapsible fields have nested fields
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
            parentPath: path,
          })

        // Tabs
        const tabs =
          'tabs' in field &&
          field.tabs &&
          Array.isArray(field.tabs) &&
          field.tabs.map((tab) => {
            const tabFieldMap = createFieldMap({
              fieldSchema: tab.fields,
              filter,
              operation,
              permissions,
              readOnly: readOnlyOverride,
              parentPath: path,
            })

            return {
              name: 'name' in tab ? tab.name : undefined,
              label: 'label' in tab ? tab.label : undefined,
              subfields: tabFieldMap,
            }
          })

        // TODO: these types can get cleaned up
        const fieldComponentProps: FormFieldBase = {
          Error,
          Label,
          BeforeInput,
          AfterInput,
          Description,
          fieldMap: nestedFieldMap,
          className: 'className' in field.admin ? field?.admin?.className : undefined,
          style: 'style' in field.admin ? field?.admin?.style : undefined,
          width: 'width' in field.admin ? field?.admin?.width : undefined,
          // TODO: fix types
          // label: 'label' in field ? field.label : undefined,
          step: 'step' in field.admin ? field.admin.step : undefined,
          hasMany: 'hasMany' in field ? field.hasMany : undefined,
          maxRows: 'maxRows' in field ? field.maxRows : undefined,
          min: 'min' in field ? field.min : undefined,
          max: 'max' in field ? field.max : undefined,
          options: 'options' in field ? field.options : undefined,
          tabs,
        }

        const Field = <FieldComponent {...fieldComponentProps} />

        const reducedField: ReducedField = {
          name: 'name' in field ? field.name : '',
          type: field.type,
          Field,
          fieldIsPresentational,
          fieldPermissions,
          isFieldAffectingData,
          readOnly,
          isSidebar: field.admin?.position === 'sidebar',
          subfields: nestedFieldMap,
          tabs,
        }

        if (FieldComponent) {
          acc.push(reducedField)
        }
      }
    }

    return acc
  }, [])
}
