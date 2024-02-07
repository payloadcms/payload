import React, { Fragment } from 'react'

import type { FieldPermissions } from 'payload/auth'
import type { CellProps, Field, FieldWithPath, LabelProps } from 'payload/types'
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/types'
import { fieldTypes } from '../../../forms/fields'
import { FormFieldBase } from '../../../forms/fields/shared'
import { FieldMap, ReducedBlock, MappedField, MappedTab } from '../types'
import { RenderCustomComponent } from '../../../elements/RenderCustomComponent'
import type { Props as FieldDescription } from '../../../forms/FieldDescription/types'
import { DefaultCell } from '../../../views/List/Cell'
import { SortColumn } from '../../../elements/SortColumn'
import DefaultLabel from '../../../forms/Label'
import DefaultError from '../../../forms/Error'
import DefaultDescription from '../../../forms/FieldDescription'
import { HiddenInput } from '../../..'

export const mapFields = (args: {
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
}): FieldMap => {
  const {
    fieldSchema,
    filter,
    operation = 'update',
    permissions,
    readOnly: readOnlyOverride,
    parentPath,
  } = args

  const result: FieldMap = fieldSchema.reduce((acc, field): FieldMap => {
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

        const labelProps: LabelProps = {
          htmlFor: 'TODO',
          // TODO: fix types
          // @ts-ignore-next-line
          label: 'label' in field ? field.label : null,
          required: 'required' in field ? field.required : undefined,
        }

        const descriptionProps: FieldDescription = {
          description:
            field.admin &&
            'description' in field.admin &&
            typeof field.admin?.description === 'string'
              ? field.admin.description
              : undefined,
        }

        const nestedFieldMap =
          'fields' in field &&
          field.fields &&
          Array.isArray(field.fields) &&
          mapFields({
            fieldSchema: field.fields,
            filter,
            operation,
            permissions,
            readOnly: readOnlyOverride,
            parentPath: path,
          })

        // `tabs` fields require a field map of each of its tab's nested fields
        const tabs =
          'tabs' in field &&
          field.tabs &&
          Array.isArray(field.tabs) &&
          field.tabs.map((tab) => {
            const tabFieldMap = mapFields({
              fieldSchema: tab.fields,
              filter,
              operation,
              permissions,
              readOnly: readOnlyOverride,
              parentPath: path,
            })

            const reducedTab: MappedTab = {
              name: 'name' in tab ? tab.name : undefined,
              label: tab.label,
              subfields: tabFieldMap,
            }

            return reducedTab
          })

        // `blocks` fields require a field map of each of its block's nested fields
        const blocks =
          'blocks' in field &&
          field.blocks &&
          Array.isArray(field.blocks) &&
          field.blocks.map((block) => {
            const blockFieldMap = mapFields({
              fieldSchema: block.fields,
              filter,
              operation,
              permissions,
              readOnly: readOnlyOverride,
              parentPath: path,
            })

            const reducedBlock: ReducedBlock = {
              slug: block.slug,
              subfields: blockFieldMap,
              labels: block.labels,
              imageAltText: block.imageAltText,
              imageURL: block.imageURL,
            }

            return reducedBlock
          })

        // TODO: these types can get cleaned up
        // i.e. not all fields have `maxRows` or `min` or `max`
        // but this is labor intensive and requires consuming components to be updated
        const fieldComponentProps: FormFieldBase = {
          fieldMap: nestedFieldMap,
          className: 'className' in field.admin ? field?.admin?.className : undefined,
          style: 'style' in field.admin ? field?.admin?.style : undefined,
          width: 'width' in field.admin ? field?.admin?.width : undefined,
          Label: (
            <RenderCustomComponent
              DefaultComponent={DefaultLabel}
              CustomComponent={
                field.admin?.components &&
                'Label' in field.admin?.components &&
                field.admin?.components?.Label
              }
              componentProps={labelProps}
            />
          ),
          Error: (
            <RenderCustomComponent
              DefaultComponent={DefaultError}
              CustomComponent={
                field.admin?.components &&
                'Error' in field.admin?.components &&
                field.admin?.components?.Error
              }
              componentProps={{ path }}
            />
          ),
          BeforeInput: field.admin?.components &&
            'beforeInput' in field.admin?.components &&
            Array.isArray(field.admin.components.beforeInput) && (
              <Fragment>
                {field.admin.components.beforeInput.map((Component, i) => (
                  <Component key={i} />
                ))}
              </Fragment>
            ),
          AfterInput: 'components' in field.admin &&
            'afterInput' in field.admin.components &&
            Array.isArray(field.admin.components.afterInput) && (
              <Fragment>
                {field.admin.components.afterInput.map((Component, i) => (
                  <Component key={i} />
                ))}
              </Fragment>
            ),
          Description: (
            <RenderCustomComponent
              CustomComponent={
                field.admin &&
                'description' in field.admin &&
                field.admin.description &&
                typeof field.admin.description === 'function' &&
                (field.admin.description as React.FC<any>)
              }
              DefaultComponent={DefaultDescription}
              componentProps={descriptionProps}
            />
          ),
          // TODO: fix types
          // label: 'label' in field ? field.label : undefined,
          step: 'step' in field.admin ? field.admin.step : undefined,
          hasMany: 'hasMany' in field ? field.hasMany : undefined,
          maxRows: 'maxRows' in field ? field.maxRows : undefined,
          min: 'min' in field ? field.min : undefined,
          max: 'max' in field ? field.max : undefined,
          options: 'options' in field ? field.options : undefined,
          tabs,
          blocks,
          relationTo: 'relationTo' in field ? field.relationTo : undefined,
        }

        const Field = <FieldComponent {...fieldComponentProps} />

        const cellComponentProps: CellProps = {
          fieldType: field.type,
          isFieldAffectingData,
          name: 'name' in field ? field.name : undefined,
          label:
            'label' in field && field.label && typeof field.label !== 'function'
              ? field.label
              : undefined,
          labels: 'labels' in field ? field.labels : undefined,
          dateDisplayFormat: 'date' in field.admin ? field.admin.date.displayFormat : undefined,
          blocks:
            'blocks' in field &&
            field.blocks.map((b) => ({
              labels: b.labels,
              slug: b.slug,
            })),
          options: 'options' in field ? field.options : undefined,
        }

        const reducedField: MappedField = {
          name: 'name' in field ? field.name : '',
          label: 'label' in field && typeof field.label !== 'function' ? field.label : undefined,
          type: field.type,
          Field,
          Cell: (
            <RenderCustomComponent
              DefaultComponent={DefaultCell}
              CustomComponent={field.admin?.components?.Cell}
              componentProps={cellComponentProps}
            />
          ),
          Heading: (
            <SortColumn
              disable={
                ('disableSort' in field && Boolean(field.disableSort)) ||
                fieldIsPresentationalOnly(field) ||
                undefined
              }
              label={
                'label' in field && field.label && typeof field.label !== 'function'
                  ? field.label
                  : 'name' in field
                  ? field.name
                  : undefined
              }
              name={'name' in field ? field.name : undefined}
            />
          ),
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

  const hasID = result.findIndex((field) => fieldAffectsData(field) && field.name === 'id') > -1

  if (!hasID) {
    result.push({
      name: 'id',
      type: 'text',
      label: 'ID',
      Field: <HiddenInput name="id" />,
      Cell: <DefaultCell name="id" />,
      Heading: <SortColumn label="ID" name="id" />,
      fieldIsPresentational: false,
      fieldPermissions: {},
      isFieldAffectingData: true,
      readOnly: false,
      isSidebar: false,
      subfields: [],
      tabs: [],
    })
  }

  return result
}
