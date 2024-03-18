import type { CellProps, Field, FieldWithPath, LabelProps, SanitizedConfig } from 'payload/types'

import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/types'
import { isPlainObject } from 'payload/utilities'
import React, { Fragment } from 'react'

import type { Props as FieldDescription } from '../../forms/FieldDescription/types.js'
import type { ArrayFieldProps } from '../../forms/fields/Array/types.js'
import type { BlocksFieldProps } from '../../forms/fields/Blocks/types.js'
import type { CheckboxFieldProps } from '../../forms/fields/Checkbox/types.js'
import type { CodeFieldProps } from '../../forms/fields/Code/types.js'
import type { CollapsibleFieldProps } from '../../forms/fields/Collapsible/types.js'
import type { DateFieldProps } from '../../forms/fields/DateTime/types.js'
import type { EmailFieldProps } from '../../forms/fields/Email/types.js'
import type { GroupFieldProps } from '../../forms/fields/Group/types.js'
import type { JSONFieldProps } from '../../forms/fields/JSON/types.js'
import type { NumberFieldProps } from '../../forms/fields/Number/types.js'
import type { PointFieldProps } from '../../forms/fields/Point/types.js'
import type { RelationshipFieldProps } from '../../forms/fields/Relationship/types.js'
import type { RowFieldProps } from '../../forms/fields/Row/types.js'
import type { SelectFieldProps } from '../../forms/fields/Select/types.js'
import type { TabsFieldProps } from '../../forms/fields/Tabs/types.js'
import type { TextFieldProps } from '../../forms/fields/Text/types.js'
import type { TextareaFieldProps } from '../../forms/fields/Textarea/types.js'
import type { UploadFieldProps } from '../../forms/fields/Upload/types.js'
import type { FormFieldBase } from '../../forms/fields/shared.js'
import type {
  FieldComponentProps,
  FieldMap,
  MappedField,
  MappedTab,
  ReducedBlock,
} from './types.js'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { SortColumn } from '../../elements/SortColumn/index.js'
import DefaultError from '../../forms/Error/index.js'
import DefaultDescription from '../../forms/FieldDescription/index.js'
import DefaultLabel from '../../forms/Label/index.js'
import { HiddenInput } from '../../index.js'

export const mapFields = (args: {
  DefaultCell?: React.FC<any>
  config: SanitizedConfig
  /**
   * If mapFields is used outside of collections, you might not want it to add an id field
   */
  disableAddingID?: boolean
  fieldSchema: FieldWithPath[]
  filter?: (field: Field) => boolean
  parentPath?: string
  readOnly?: boolean
}): FieldMap => {
  const {
    DefaultCell,
    config,
    disableAddingID,
    fieldSchema,
    filter,
    parentPath,
    readOnly: readOnlyOverride,
  } = args

  const result: FieldMap = fieldSchema.reduce((acc, field): FieldMap => {
    const fieldIsPresentational = fieldIsPresentationalOnly(field)
    let CustomFieldComponent: React.ComponentType<FieldComponentProps>
    let CellComponent = field.admin?.components?.Cell

    if (fieldIsPresentational || (!field?.hidden && field?.admin?.disabled !== true)) {
      if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
        if (field.admin && 'hidden' in field.admin && field?.admin?.hidden) {
          if (CustomFieldComponent) {
            CustomFieldComponent = HiddenInput
          }
        }

        const isFieldAffectingData = fieldAffectsData(field)

        const path = `${parentPath ? `${parentPath}.` : ''}${
          field.path || (isFieldAffectingData && 'name' in field ? field.name : '')
        }`

        const labelProps: LabelProps = {
          // @ts-expect-error-next-line
          label: 'label' in field ? field.label : null,
          required: 'required' in field ? field.required : undefined,
        }

        const descriptionProps: FieldDescription = {
          description:
            field.admin &&
            'description' in field.admin &&
            (typeof field.admin?.description === 'string' ||
              typeof field.admin?.description === 'object')
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
            parentPath: path,
            readOnly: readOnlyOverride,
          })

        const AfterInput = 'admin' in field &&
          'components' in field.admin &&
          'afterInput' in field.admin.components &&
          Array.isArray(field.admin?.components?.afterInput) && (
            <Fragment>
              {field.admin.components.afterInput.map((Component, i) => (
                <Component key={i} />
              ))}
            </Fragment>
          )

        const BeforeInput = 'admin' in field &&
          field.admin?.components &&
          'beforeInput' in field.admin.components &&
          Array.isArray(field.admin.components.beforeInput) && (
            <Fragment>
              {field.admin.components.beforeInput.map((Component, i) => (
                <Component key={i} />
              ))}
            </Fragment>
          )

        const Description = (
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
        )

        const Error = (
          <RenderCustomComponent
            CustomComponent={
              'admin' in field &&
              field.admin.components &&
              'Error' in field.admin.components &&
              field.admin?.components?.Error
            }
            DefaultComponent={DefaultError}
            componentProps={{ path }}
          />
        )

        const Label = (
          <RenderCustomComponent
            CustomComponent={
              'admin' in field &&
              field.admin?.components &&
              'Label' in field.admin.components &&
              field.admin?.components?.Label
            }
            DefaultComponent={DefaultLabel}
            componentProps={labelProps}
          />
        )

        const baseFieldProps: FormFieldBase = {
          AfterInput,
          BeforeInput,
          Description,
          Error,
          Label,
          disabled: 'admin' in field && 'disabled' in field.admin ? field.admin?.disabled : false,
          path,
          required: 'required' in field ? field.required : undefined,
        }

        let fieldComponentProps: FieldComponentProps

        const cellComponentProps: CellProps = {
          name: 'name' in field ? field.name : undefined,
          fieldType: field.type,
          isFieldAffectingData,
          label:
            'label' in field && field.label && typeof field.label !== 'function'
              ? field.label
              : undefined,
          labels: 'labels' in field ? field.labels : undefined,
          options: 'options' in field ? field.options : undefined,
        }

        switch (field.type) {
          case 'array': {
            let RowLabel: React.ReactNode

            if (
              'admin' in field &&
              field.admin.components &&
              'RowLabel' in field.admin.components &&
              field.admin.components.RowLabel &&
              !isPlainObject(field.admin.components.RowLabel)
            ) {
              const CustomRowLabel = field.admin.components.RowLabel as React.ComponentType
              RowLabel = <CustomRowLabel />
            }

            const arrayFieldProps: Omit<ArrayFieldProps, 'indexPath' | 'permissions'> = {
              ...baseFieldProps,
              name: field.name,
              RowLabel,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: nestedFieldMap,
              label: field?.label || undefined,
              labels: field.labels,
              maxRows: field.maxRows,
              minRows: field.minRows,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = arrayFieldProps
            break
          }
          case 'blocks': {
            const blocks = field.blocks.map((block) => {
              const blockFieldMap = mapFields({
                DefaultCell,
                config,
                fieldSchema: block.fields,
                filter,
                parentPath: `${path}.${block.slug}`,
                readOnly: readOnlyOverride,
              })

              const reducedBlock: ReducedBlock = {
                slug: block.slug,
                fieldMap: blockFieldMap,
                imageAltText: block.imageAltText,
                imageURL: block.imageURL,
                labels: block.labels,
              }

              return reducedBlock
            })

            const blocksField: Omit<BlocksFieldProps, 'indexPath' | 'permissions'> = {
              ...baseFieldProps,
              name: field.name,
              blocks,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: nestedFieldMap,
              label: field?.label || undefined,
              labels: field.labels,
              maxRows: field.maxRows,
              minRows: field.minRows,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = blocksField

            cellComponentProps.blocks = field.blocks.map((b) => ({
              slug: b.slug,
              labels: b.labels,
            }))

            break
          }
          case 'checkbox': {
            const checkboxField: CheckboxFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              label: field.label,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = checkboxField
            break
          }
          case 'code': {
            const codeField: CodeFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              editorOptions: field.admin?.editorOptions,
              label: field.label,
              language: field.admin?.language,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = codeField
            break
          }
          case 'collapsible': {
            let CollapsibleLabel: React.ReactNode

            if (typeof field.label === 'object' && !isPlainObject(field.label)) {
              const LabelToRender = field.label as unknown as React.ComponentType
              CollapsibleLabel = <LabelToRender />
            }

            const collapsibleField: Omit<CollapsibleFieldProps, 'indexPath' | 'permissions'> = {
              ...baseFieldProps,
              Label: CollapsibleLabel,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: nestedFieldMap,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = collapsibleField
            break
          }
          case 'date': {
            const dateField: DateFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              date: field.admin?.date,
              disabled: field.admin?.disabled,
              label: field.label,
              placeholder: field.admin?.placeholder,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = dateField
            cellComponentProps.dateDisplayFormat = field.admin?.date?.displayFormat
            break
          }
          case 'email': {
            const emailField: EmailFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              placeholder: field.admin?.placeholder,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = emailField
            break
          }
          case 'group': {
            const groupField: Omit<GroupFieldProps, 'indexPath' | 'permissions'> = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: nestedFieldMap,
              readOnly: field.admin?.readOnly,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = groupField
            break
          }
          case 'json': {
            const jsonField: JSONFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              editorOptions: field.admin?.editorOptions,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = jsonField
            break
          }
          case 'number': {
            const numberField: NumberFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              hasMany: field.hasMany,
              max: field.max,
              maxRows: field.maxRows,
              min: field.min,
              readOnly: field.admin?.readOnly,
              required: field.required,
              step: field.admin?.step,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = numberField
            break
          }
          case 'point': {
            const pointField: PointFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = pointField
            break
          }
          case 'relationship': {
            const relationshipField: RelationshipFieldProps = {
              ...baseFieldProps,
              name: field.name,
              allowCreate: field.admin.allowCreate,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              hasMany: field.hasMany,
              readOnly: field.admin?.readOnly,
              relationTo: field.relationTo,
              required: field.required,
              sortOptions: field.admin.sortOptions,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = relationshipField
            break
          }
          case 'richText': {
            const richTextField = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = richTextField

            const RichTextFieldComponent = field.editor.FieldComponent
            const RichTextCellComponent = field.editor.CellComponent

            if (typeof field.editor.generateComponentMap === 'function') {
              const result = field.editor.generateComponentMap({ config, schemaPath: path })
              // @ts-expect-error-next-line // TODO: the `richTextComponentMap` is not found on the union type
              fieldComponentProps.richTextComponentMap = result
              cellComponentProps.richTextComponentMap = result
            }

            if (RichTextFieldComponent) {
              CustomFieldComponent = RichTextFieldComponent
            }

            if (RichTextCellComponent) {
              CellComponent = RichTextCellComponent
            }

            break
          }
          case 'row': {
            const rowField: Omit<RowFieldProps, 'indexPath' | 'permissions'> = {
              ...baseFieldProps,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: nestedFieldMap,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = rowField
            break
          }
          case 'tabs': {
            // `tabs` fields require a field map of each of its tab's nested fields
            const tabs = field.tabs.map((tab) => {
              const tabFieldMap = mapFields({
                DefaultCell,
                config,
                fieldSchema: tab.fields,
                filter,
                parentPath: path,
                readOnly: readOnlyOverride,
              })

              const reducedTab: MappedTab = {
                name: 'name' in tab ? tab.name : undefined,
                fieldMap: tabFieldMap,
                label: tab.label,
              }

              return reducedTab
            })

            const tabsField: Omit<TabsFieldProps, 'indexPath' | 'permissions'> = {
              ...baseFieldProps,
              name: 'name' in field ? (field.name as string) : undefined,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: nestedFieldMap,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              tabs,
              width: field.admin?.width,
            }

            fieldComponentProps = tabsField
            break
          }
          case 'text': {
            const textField: TextFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              maxLength: field.maxLength,
              minLength: field.minLength,
              placeholder: field.admin?.placeholder,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = textField
            break
          }
          case 'textarea': {
            const textareaField: TextareaFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              maxLength: field.maxLength,
              minLength: field.minLength,
              placeholder: field.admin?.placeholder,
              readOnly: field.admin?.readOnly,
              required: field.required,
              rows: field.admin?.rows,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = textareaField
            break
          }
          case 'ui': {
            fieldComponentProps = baseFieldProps
            break
          }
          case 'upload': {
            const uploadField: UploadFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              filterOptions: field.filterOptions,
              readOnly: field.admin?.readOnly,
              relationTo: field.relationTo,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = uploadField
            break
          }
          case 'select': {
            const selectField: SelectFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              hasMany: field.hasMany,
              isClearable: field.admin?.isClearable,
              options: field.options,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = selectField
            break
          }
          default: {
            break
          }
        }

        const Cell = (
          <RenderCustomComponent
            CustomComponent={CellComponent}
            DefaultComponent={DefaultCell}
            componentProps={cellComponentProps}
          />
        )

        const Heading = (
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
        )

        const reducedField: MappedField = {
          name: 'name' in field ? field.name : undefined,
          type: field.type,
          Cell,
          CustomField: CustomFieldComponent ? (
            <CustomFieldComponent {...fieldComponentProps} />
          ) : null,
          Heading,
          fieldComponentProps,
          fieldIsPresentational,
          isFieldAffectingData,
          isSidebar:
            'admin' in field && 'position' in field.admin && field.admin.position === 'sidebar',
          localized: 'localized' in field ? field.localized : false,
        }

        acc.push(reducedField)
      }
    }

    return acc
  }, [])

  const hasID =
    result.findIndex((f) => 'name' in f && f.isFieldAffectingData && f.name === 'id') > -1

  if (!disableAddingID && !hasID) {
    result.push({
      type: 'text',
      Cell: DefaultCell ? <DefaultCell name="id" /> : null,
      Heading: <SortColumn label="ID" name="id" />,
      fieldComponentProps: {
        name: 'id',
      },
      fieldIsPresentational: false,
      isFieldAffectingData: true,
      // label: 'ID',
      localized: undefined,
    })
  }

  return result
}
