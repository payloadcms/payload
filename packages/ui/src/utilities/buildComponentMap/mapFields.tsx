import type { FieldPermissions } from 'payload/auth'
import type { CellProps, Field, FieldWithPath, LabelProps, SanitizedConfig } from 'payload/types'

import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/types'
import React, { Fragment } from 'react'

import type { Props as FieldDescription } from '../../forms/FieldDescription/types'
import type { FormFieldBase } from '../../forms/fields/shared'
import type { FieldMap, MappedField, MappedTab, ReducedBlock } from './types'

import { HiddenInput } from '../..'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'
import { SortColumn } from '../../elements/SortColumn'
import DefaultError from '../../forms/Error'
import DefaultDescription from '../../forms/FieldDescription'
import DefaultLabel from '../../forms/Label'
import { fieldTypes } from '../../forms/fields'

export const mapFields = (args: {
  DefaultCell?: React.FC<any>
  config: SanitizedConfig
  fieldSchema: FieldWithPath[]
  filter?: (field: Field) => boolean
  operation?: 'create' | 'update'
  parentPath?: string
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
}): FieldMap => {
  const {
    DefaultCell,
    config,
    fieldSchema,
    filter,
    operation = 'update',
    parentPath,
    permissions,
    readOnly: readOnlyOverride,
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
          // @ts-expect-error-next-line
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
            DefaultCell,
            config,
            fieldSchema: field.fields,
            filter,
            operation,
            parentPath: path,
            permissions,
            readOnly: readOnlyOverride,
          })

        // `tabs` fields require a field map of each of its tab's nested fields
        const tabs =
          'tabs' in field &&
          field.tabs &&
          Array.isArray(field.tabs) &&
          field.tabs.map((tab) => {
            const tabFieldMap = mapFields({
              DefaultCell,
              config,
              fieldSchema: tab.fields,
              filter,
              operation,
              parentPath: path,
              permissions,
              readOnly: readOnlyOverride,
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
              DefaultCell,
              config,
              fieldSchema: block.fields,
              filter,
              operation,
              parentPath: `${path}.${block.slug}`,
              permissions,
              readOnly: readOnlyOverride,
            })

            const reducedBlock: ReducedBlock = {
              slug: block.slug,
              imageAltText: block.imageAltText,
              imageURL: block.imageURL,
              labels: block.labels,
              subfields: blockFieldMap,
            }

            return reducedBlock
          })

        // TODO: these types can get cleaned up
        // i.e. not all fields have `maxRows` or `min` or `max`
        // but this is labor intensive and requires consuming components to be updated
        const fieldComponentProps: FormFieldBase = {
          AfterInput: 'components' in field.admin &&
            'afterInput' in field.admin.components &&
            Array.isArray(field.admin.components.afterInput) && (
              <Fragment>
                {field.admin.components.afterInput.map((Component, i) => (
                  <Component key={i} />
                ))}
              </Fragment>
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
          Error: (
            <RenderCustomComponent
              CustomComponent={
                field.admin?.components &&
                'Error' in field.admin?.components &&
                field.admin?.components?.Error
              }
              DefaultComponent={DefaultError}
              componentProps={{ path }}
            />
          ),
          Label: (
            <RenderCustomComponent
              CustomComponent={
                field.admin?.components &&
                'Label' in field.admin?.components &&
                field.admin?.components?.Label
              }
              DefaultComponent={DefaultLabel}
              componentProps={labelProps}
            />
          ),
          className: 'className' in field.admin ? field?.admin?.className : undefined,
          fieldMap: nestedFieldMap,
          style: 'style' in field.admin ? field?.admin?.style : undefined,
          width: 'width' in field.admin ? field?.admin?.width : undefined,
          // TODO: fix types
          // label: 'label' in field ? field.label : undefined,
          blocks,
          hasMany: 'hasMany' in field ? field.hasMany : undefined,
          max: 'max' in field ? field.max : undefined,
          maxRows: 'maxRows' in field ? field.maxRows : undefined,
          min: 'min' in field ? field.min : undefined,
          options: 'options' in field ? field.options : undefined,
          relationTo: 'relationTo' in field ? field.relationTo : undefined,
          richTextComponentMap: undefined,
          step: 'step' in field.admin ? field.admin.step : undefined,
          tabs,
        }

        let Field = <FieldComponent {...fieldComponentProps} />

        const cellComponentProps: CellProps = {
          name: 'name' in field ? field.name : undefined,
          blocks:
            'blocks' in field &&
            field.blocks.map((b) => ({
              slug: b.slug,
              labels: b.labels,
            })),
          dateDisplayFormat: 'date' in field.admin ? field.admin.date.displayFormat : undefined,
          fieldType: field.type,
          isFieldAffectingData,
          label:
            'label' in field && field.label && typeof field.label !== 'function'
              ? field.label
              : undefined,
          labels: 'labels' in field ? field.labels : undefined,
          options: 'options' in field ? field.options : undefined,
        }

        /**
         * Handle RichText Field Components, Cell Components, and component maps
         */
        if (field.type === 'richText' && 'editor' in field) {
          let RichTextFieldComponent
          let RichTextCellComponent

          const isLazyField = 'LazyFieldComponent' in field.editor
          const isLazyCell = 'LazyCellComponent' in field.editor

          if (isLazyField) {
            RichTextFieldComponent = React.lazy(() => {
              return 'LazyFieldComponent' in field.editor
                ? field.editor.LazyFieldComponent().then((resolvedComponent) => ({
                    default: resolvedComponent,
                  }))
                : null
            })
          } else if ('FieldComponent' in field.editor) {
            RichTextFieldComponent = field.editor.FieldComponent
          }

          if (isLazyCell) {
            RichTextCellComponent = React.lazy(() => {
              return 'LazyCellComponent' in field.editor
                ? field.editor.LazyCellComponent().then((resolvedComponent) => ({
                    default: resolvedComponent,
                  }))
                : null
            })
          } else if ('CellComponent' in field.editor) {
            RichTextCellComponent = field.editor.CellComponent
          }

          if (typeof field.editor.generateComponentMap === 'function') {
            const result = field.editor.generateComponentMap({ config, schemaPath: path })
            // @ts-expect-error-next-line // TODO: the `richTextComponentMap` is not found on the union type
            fieldComponentProps.richTextComponentMap = result
            cellComponentProps.richTextComponentMap = result
          }

          if (RichTextFieldComponent) {
            Field = <RichTextFieldComponent {...fieldComponentProps} />
          }

          if (RichTextCellComponent) {
            cellComponentProps.CellComponentOverride = <RichTextCellComponent />
          }
        }

        const reducedField: MappedField = {
          name: 'name' in field ? field.name : '',
          type: field.type,
          Cell: (
            <RenderCustomComponent
              CustomComponent={field.admin?.components?.Cell}
              DefaultComponent={DefaultCell}
              componentProps={cellComponentProps}
            />
          ),
          Field,
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
          blocks,
          fieldIsPresentational,
          fieldPermissions,
          hasMany: 'hasMany' in field ? field.hasMany : undefined,
          isFieldAffectingData,
          isSidebar: field.admin?.position === 'sidebar',
          label: 'label' in field && typeof field.label !== 'function' ? field.label : undefined,
          labels: 'labels' in field ? field.labels : undefined,
          localized: 'localized' in field ? field.localized : false,
          options: 'options' in field ? field.options : undefined,
          readOnly,
          relationTo: 'relationTo' in field ? field.relationTo : undefined,
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

  const hasID =
    result.findIndex(({ name, isFieldAffectingData }) => isFieldAffectingData && name === 'id') > -1

  if (!hasID) {
    result.push({
      name: 'id',
      type: 'text',
      Cell: typeof DefaultCell === 'function' ? <DefaultCell name="id" /> : null,
      Field: <HiddenInput name="id" />,
      Heading: <SortColumn label="ID" name="id" />,
      fieldIsPresentational: false,
      fieldPermissions: {} as FieldPermissions, // TODO: wire this up
      isFieldAffectingData: true,
      isSidebar: false,
      label: 'ID',
      labels: undefined,
      localized: undefined,
      readOnly: false,
      subfields: [],
      tabs: [],
    })
  }

  return result
}
