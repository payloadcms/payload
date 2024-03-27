import type { FieldDescriptionProps } from '@payloadcms/ui/forms/FieldDescription'
import type {
  CellComponentProps,
  Field,
  FieldBase,
  FieldWithPath,
  LabelProps,
  RowLabelComponent,
  SanitizedConfig,
} from 'payload/types'

import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/types'
import { isPlainObject } from 'payload/utilities'
import React, { Fragment } from 'react'

import type { RadioFieldProps } from '../../..//fields/RadioGroup/index.js'
import type { RichTextFieldProps } from '../../..//fields/RichText/index.js'
import type { ArrayFieldProps } from '../../../fields/Array/index.js'
import type { BlocksFieldProps } from '../../../fields/Blocks/index.js'
import type { CheckboxFieldProps } from '../../../fields/Checkbox/index.js'
import type { CodeFieldProps } from '../../../fields/Code/index.js'
import type { CollapsibleFieldProps } from '../../../fields/Collapsible/index.js'
import type { DateFieldProps } from '../../../fields/DateTime/index.js'
import type { EmailFieldProps } from '../../../fields/Email/index.js'
import type { GroupFieldProps } from '../../../fields/Group/index.js'
import type { JSONFieldProps } from '../../../fields/JSON/index.js'
import type { NumberFieldProps } from '../../../fields/Number/index.js'
import type { PointFieldProps } from '../../../fields/Point/index.js'
import type { RelationshipFieldProps } from '../../../fields/Relationship/types.js'
import type { RowFieldProps } from '../../../fields/Row/types.js'
import type { SelectFieldProps } from '../../../fields/Select/index.js'
import type { TabsFieldProps } from '../../../fields/Tabs/index.js'
import type { TextFieldProps } from '../../../fields/Text/types.js'
import type { TextareaFieldProps } from '../../../fields/Textarea/types.js'
import type { UploadFieldProps } from '../../../fields/Upload/types.js'
import type { FormFieldBase } from '../../../fields/shared/index.js'
import type {
  FieldComponentProps,
  FieldMap,
  MappedField,
  MappedTab,
  ReducedBlock,
} from './types.js'

import { HiddenInput } from '../../../fields/HiddenInput/index.js'

export const mapFields = (args: {
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
    config,
    disableAddingID,
    fieldSchema,
    filter,
    parentPath,
    readOnly: readOnlyOverride,
  } = args

  const result: FieldMap = fieldSchema.reduce((acc, field): FieldMap => {
    const fieldIsPresentational = fieldIsPresentationalOnly(field)
    let CustomFieldComponent: React.ComponentType<FieldComponentProps> =
      field.admin?.components?.Field

    const CustomCellComponent = field.admin?.components?.Cell

    const isHidden = field?.admin && 'hidden' in field.admin && field.admin.hidden

    if (fieldIsPresentational || (!field?.hidden && field?.admin?.disabled !== true)) {
      if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
        if (isHidden) {
          if (CustomFieldComponent) {
            CustomFieldComponent = HiddenInput
          }
        }

        const isFieldAffectingData = fieldAffectsData(field)

        const path = `${parentPath ? `${parentPath}.` : ''}${
          field.path || (isFieldAffectingData && 'name' in field ? field.name : '')
        }`

        const labelProps: LabelProps = {
          label:
            'label' in field &&
            (typeof field.label !== 'function' ||
              (typeof field.label === 'object' && isPlainObject(field.label)))
              ? field.label
              : undefined,
          required: 'required' in field ? field.required : undefined,
        }

        const descriptionProps: FieldDescriptionProps = {
          description:
            field.admin &&
            'description' in field.admin &&
            (typeof field.admin?.description === 'string' ||
              typeof field.admin?.description === 'object')
              ? field.admin.description
              : undefined,
        }

        const AfterInput =
          ('admin' in field &&
            'components' in field.admin &&
            'afterInput' in field.admin.components &&
            Array.isArray(field.admin?.components?.afterInput) && (
              <Fragment>
                {field.admin.components.afterInput.map((Component, i) => (
                  <Component key={i} />
                ))}
              </Fragment>
            )) ||
          null

        const BeforeInput =
          ('admin' in field &&
            field.admin?.components &&
            'beforeInput' in field.admin.components &&
            Array.isArray(field.admin.components.beforeInput) && (
              <Fragment>
                {field.admin.components.beforeInput.map((Component, i) => (
                  <Component key={i} />
                ))}
              </Fragment>
            )) ||
          null

        const CustomDescriptionComponent =
          (field.admin &&
            'description' in field.admin &&
            field.admin.description &&
            typeof field.admin.description === 'function' &&
            (field.admin.description as React.FC<any>)) ||
          undefined

        const CustomDescription =
          CustomDescriptionComponent !== undefined ? (
            <CustomDescriptionComponent {...(descriptionProps || {})} />
          ) : undefined

        const CustomErrorComponent =
          ('admin' in field &&
            field.admin?.components &&
            'Error' in field.admin.components &&
            field.admin?.components?.Error) ||
          undefined

        const errorProps = {
          path,
        }

        const CustomError =
          CustomErrorComponent !== undefined ? (
            <CustomErrorComponent {...(errorProps || {})} />
          ) : undefined

        const CustomLabelComponent =
          ('admin' in field &&
            field.admin?.components &&
            'Label' in field.admin.components &&
            field.admin?.components?.Label) ||
          undefined

        const CustomLabel =
          CustomLabelComponent !== undefined ? (
            <CustomLabelComponent {...(labelProps || {})} />
          ) : undefined

        const baseFieldProps: FormFieldBase = {
          AfterInput,
          BeforeInput,
          CustomDescription,
          CustomError,
          CustomLabel,
          descriptionProps,
          disabled: 'admin' in field && 'disabled' in field.admin ? field.admin?.disabled : false,
          errorProps,
          labelProps,
          path,
          required: 'required' in field ? field.required : undefined,
        }

        let fieldComponentProps: FieldComponentProps

        const cellComponentProps: CellComponentProps = {
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
            let CustomRowLabel: React.ReactNode

            if (
              'admin' in field &&
              field.admin.components &&
              'RowLabel' in field.admin.components &&
              field.admin.components.RowLabel &&
              (typeof field.admin.components.RowLabel === 'function' ||
                // Do this to test for client components (`use client` directive) bc they import as empty objects
                (typeof field.admin.components.RowLabel === 'object' &&
                  !isPlainObject(field.admin.components.RowLabel)))
            ) {
              const CustomRowLabelComponent = field.admin.components.RowLabel as RowLabelComponent
              CustomRowLabel = <CustomRowLabelComponent />
            }

            const arrayFieldProps: Omit<ArrayFieldProps, 'indexPath' | 'permissions'> = {
              ...baseFieldProps,
              name: field.name,
              CustomRowLabel,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: mapFields({
                config,
                fieldSchema: field.fields,
                filter,
                parentPath: path,
                readOnly: readOnlyOverride,
              }),
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
            let CustomCollapsibleLabel: React.ReactNode

            if (
              typeof field.label === 'function' ||
              // Do this to test for client components (`use client` directive) bc they import as empty objects
              (typeof field.label === 'object' && !isPlainObject(field.label))
            ) {
              const CustomCollapsibleLabelComponent = field.label as RowLabelComponent
              CustomCollapsibleLabel = <CustomCollapsibleLabelComponent />
            }

            const collapsibleField: Omit<CollapsibleFieldProps, 'indexPath' | 'permissions'> = {
              ...baseFieldProps,
              CustomLabel: CustomCollapsibleLabel,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: mapFields({
                config,
                disableAddingID: true,
                fieldSchema: field.fields,
                filter,
                parentPath: path,
                readOnly: readOnlyOverride,
              }),
              initCollapsed: field.admin?.initCollapsed,
              label: !CustomCollapsibleLabel ? (field.label as FieldBase['label']) : undefined,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = collapsibleField as CollapsibleFieldProps // TODO: dunno why this is needed
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
              label: field.label,
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
              fieldMap: mapFields({
                config,
                disableAddingID: true,
                fieldSchema: field.fields,
                filter,
                parentPath: path,
                readOnly: readOnlyOverride,
              }),
              label: field.label,
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
              label: field.label,
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
              label: field.label,
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
              label: field.label,
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
              label: field.label,
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
          case 'radio': {
            const radioField: RadioFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              label: field.label,
              options: field.options,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentProps = radioField
            break
          }
          case 'richText': {
            const richTextField: RichTextFieldProps = {
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

            const RichTextFieldComponent = field.editor.FieldComponent
            const RichTextCellComponent = field.editor.CellComponent

            if (typeof field.editor.generateComponentMap === 'function') {
              const result = field.editor.generateComponentMap({ config, schemaPath: path })
              richTextField.richTextComponentMap = result
              cellComponentProps.richTextComponentMap = result
            }

            if (RichTextFieldComponent) {
              CustomFieldComponent = RichTextFieldComponent
            }

            if (RichTextCellComponent) {
              cellComponentProps.CellComponentOverride = <RichTextCellComponent />
            }

            fieldComponentProps = richTextField

            break
          }
          case 'row': {
            const rowField: Omit<RowFieldProps, 'indexPath' | 'permissions'> = {
              ...baseFieldProps,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: mapFields({
                config,
                disableAddingID: true,
                fieldSchema: field.fields,
                filter,
                parentPath: path,
                readOnly: readOnlyOverride,
              }),
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
                config,
                disableAddingID: true,
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
              hasMany: field.hasMany,
              label: field.label,
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
              label: field.label,
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
              label: field.label,
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
              label: field.label,
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

        const reducedField: MappedField = {
          name: 'name' in field ? field.name : undefined,
          type: field.type,
          CustomCell: CustomCellComponent ? (
            <CustomCellComponent {...cellComponentProps} />
          ) : undefined,
          CustomField: CustomFieldComponent ? (
            <CustomFieldComponent {...fieldComponentProps} />
          ) : undefined,
          cellComponentProps,
          disableBulkEdit:
            'admin' in field && 'disableBulkEdit' in field.admin && field.admin.disableBulkEdit,
          fieldComponentProps,
          fieldIsPresentational,
          isFieldAffectingData,
          isHidden,
          isSidebar:
            'admin' in field && 'position' in field.admin && field.admin.position === 'sidebar',
          localized: 'localized' in field ? field.localized : false,
          unique: 'unique' in field ? field.unique : false,
        }

        acc.push(reducedField)
      }
    }

    return acc
  }, [])

  const hasID =
    result.findIndex((f) => 'name' in f && f.isFieldAffectingData && f.name === 'id') > -1

  if (!disableAddingID && !hasID) {
    // TODO: For all fields (not just this one) we need to add the name to both .fieldComponentProps.name AND .name. This can probably be improved
    result.push({
      name: 'id',
      type: 'text',
      cellComponentProps: {
        name: 'id',
      },
      disableBulkEdit: true,
      fieldComponentProps: {
        name: 'id',
        label: 'ID',
        labelProps: {
          label: 'ID',
        },
      },
      fieldIsPresentational: false,
      isFieldAffectingData: true,
      isHidden: true,
      localized: undefined,
    })
  }

  return result
}
