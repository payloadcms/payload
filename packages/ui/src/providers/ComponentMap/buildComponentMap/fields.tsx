import type { I18nClient } from '@payloadcms/translations'
import type {
  ArrayFieldProps,
  BlocksFieldProps,
  CellComponentProps,
  CheckboxFieldProps,
  CodeFieldProps,
  CollapsibleFieldProps,
  CustomComponent,
  DateFieldProps,
  EmailFieldProps,
  Field,
  FieldComponentProps,
  FieldDescriptionProps,
  FieldMap,
  FieldWithPath,
  FormFieldBase,
  GroupFieldProps,
  JSONFieldProps,
  LabelProps,
  MappedField,
  MappedTab,
  NumberFieldProps,
  Option,
  Payload,
  PointFieldProps,
  RadioFieldProps,
  ReducedBlock,
  RelationshipFieldProps,
  RichTextComponentProps,
  RowFieldProps,
  SanitizedConfig,
  SelectFieldProps,
  TabsFieldProps,
  TextFieldProps,
  TextareaFieldProps,
  UploadFieldProps,
} from 'payload'

import { MissingEditorProp } from 'payload'
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/shared'
import React, { Fragment } from 'react'

import type { WithServerSidePropsPrePopulated } from './index.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { FieldDescription, HiddenField } from '../../../exports/client/index.js'

function generateFieldPath(parentPath, name) {
  let tabPath = parentPath || ''
  if (parentPath && name) {
    tabPath = `${parentPath}.${name}`
  } else if (!parentPath && name) {
    tabPath = name
  }

  return tabPath
}

export const mapFields = (args: {
  WithServerSideProps: WithServerSidePropsPrePopulated
  config: SanitizedConfig
  /**
   * If mapFields is used outside of collections, you might not want it to add an id field
   */
  disableAddingID?: boolean
  fieldSchema: FieldWithPath[]
  filter?: (field: Field) => boolean
  i18n: I18nClient
  parentPath?: string
  payload: Payload
  readOnly?: boolean
}): FieldMap => {
  const {
    WithServerSideProps,
    config,
    disableAddingID,
    fieldSchema,
    filter,
    i18n,
    i18n: { t },
    parentPath,
    payload,
    readOnly: readOnlyOverride,
  } = args

  const result: FieldMap = fieldSchema.reduce((acc, field): FieldMap => {
    const fieldIsPresentational = fieldIsPresentationalOnly(field)
    let CustomFieldComponent: CustomComponent<FieldComponentProps> = field.admin?.components?.Field

    let CustomCellComponent = field.admin?.components?.Cell

    const isHidden = field?.admin && 'hidden' in field.admin && field.admin.hidden

    if (fieldIsPresentational || (!field?.hidden && field?.admin?.disabled !== true)) {
      if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
        if (isHidden) {
          if (CustomFieldComponent) {
            CustomFieldComponent = HiddenField
          }
        }

        const isFieldAffectingData = fieldAffectsData(field)

        const path = generateFieldPath(
          parentPath,
          isFieldAffectingData && 'name' in field ? field.name : '',
        )

        const AfterInput =
          ('admin' in field &&
            'components' in field.admin &&
            'afterInput' in field.admin.components &&
            Array.isArray(field.admin?.components?.afterInput) && (
              <Fragment>
                {field.admin.components.afterInput.map((Component, i) => (
                  <WithServerSideProps Component={Component} key={i} />
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
                  <WithServerSideProps Component={Component} key={i} />
                ))}
              </Fragment>
            )) ||
          null

        let label: FormFieldBase['label'] = undefined

        if ('label' in field) {
          if (typeof field.label === 'string' || typeof field.label === 'object') {
            label = field.label
          } else if (typeof field.label === 'function') {
            label = field.label({ t })
          }
        }

        // These fields are shared across all field types even if they are not used in the default field, as the custom field component can use them
        const baseFieldProps: FormFieldBase = {
          AfterInput,
          BeforeInput,
          custom: 'admin' in field && 'custom' in field.admin ? field.admin?.custom : undefined,
          disabled: 'admin' in field && 'disabled' in field.admin ? field.admin?.disabled : false,
          label,
          path,
          required: 'required' in field ? field.required : undefined,
        }

        let fieldComponentPropsBase: Omit<FieldComponentProps, 'type'>

        let fieldOptions: Option[]

        if ('options' in field) {
          fieldOptions = field.options.map((option) => {
            if (typeof option === 'object' && typeof option.label === 'function') {
              return {
                label: option.label({ t }),
                value: option.value,
              }
            }

            return option
          })
        }

        const cellComponentProps: CellComponentProps = {
          name: 'name' in field ? field.name : undefined,
          fieldType: field.type,
          isFieldAffectingData,
          label,
          labels: 'labels' in field ? field.labels : undefined,
          options: 'options' in field ? fieldOptions : undefined,
          relationTo: 'relationTo' in field ? field.relationTo : undefined,
          schemaPath: path,
        }

        switch (field.type) {
          case 'array': {
            const arrayFieldProps: ArrayFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: mapFields({
                WithServerSideProps,
                config,
                fieldSchema: field.fields,
                filter,
                i18n,
                parentPath: path,
                payload,
                readOnly: readOnlyOverride,
              }),
              isSortable: field.admin?.isSortable,
              labels: field.labels,
              maxRows: field.maxRows,
              minRows: field.minRows,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = arrayFieldProps
            break
          }
          case 'blocks': {
            const blocks = field.blocks.map((block) => {
              const blockFieldMap = mapFields({
                WithServerSideProps,
                config,
                fieldSchema: block.fields,
                filter,
                i18n,
                parentPath: `${path}.${block.slug}`,
                payload,
                readOnly: readOnlyOverride,
              })

              const reducedBlock: ReducedBlock = {
                slug: block.slug,
                LabelComponent: block.admin?.components?.Label,
                custom: block.admin?.custom,
                fieldMap: blockFieldMap,
                imageAltText: block.imageAltText,
                imageURL: block.imageURL,
                labels: block.labels,
              }

              return reducedBlock
            })

            const blocksField: BlocksFieldProps = {
              ...baseFieldProps,
              name: field.name,
              blocks,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              isSortable: field.admin?.isSortable,
              labels: field.labels,
              maxRows: field.maxRows,
              minRows: field.minRows,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = blocksField

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
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = checkboxField
            break
          }
          case 'code': {
            const codeField: CodeFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              editorOptions: field.admin?.editorOptions,
              language: field.admin?.language,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = codeField
            break
          }
          case 'collapsible': {
            const collapsibleField: CollapsibleFieldProps = {
              ...baseFieldProps,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: mapFields({
                WithServerSideProps,
                config,
                disableAddingID: true,
                fieldSchema: field.fields,
                filter,
                i18n,
                parentPath: path,
                payload,
                readOnly: readOnlyOverride,
              }),
              initCollapsed: field.admin?.initCollapsed,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = collapsibleField // TODO: dunno why this is needed
            break
          }
          case 'date': {
            const dateField: DateFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              date: field.admin?.date,
              disabled: field.admin?.disabled,
              placeholder: field.admin?.placeholder,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = dateField
            cellComponentProps.dateDisplayFormat = field.admin?.date?.displayFormat
            break
          }
          case 'email': {
            const emailField: EmailFieldProps = {
              ...baseFieldProps,
              name: field.name,
              autoComplete: field.admin?.autoComplete,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              placeholder: field.admin?.placeholder,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = emailField
            break
          }
          case 'group': {
            const groupField: GroupFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: mapFields({
                WithServerSideProps,
                config,
                disableAddingID: true,
                fieldSchema: field.fields,
                filter,
                i18n,
                parentPath: path,
                payload,
                readOnly: readOnlyOverride,
              }),
              hideGutter: field.admin?.hideGutter,
              readOnly: field.admin?.readOnly,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = groupField
            break
          }
          case 'json': {
            const jsonField: JSONFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              editorOptions: field.admin?.editorOptions,
              jsonSchema: field.jsonSchema,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = jsonField
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

            fieldComponentPropsBase = numberField
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

            fieldComponentPropsBase = pointField
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
              isSortable: field.admin?.isSortable,
              readOnly: field.admin?.readOnly,
              relationTo: field.relationTo,
              required: field.required,
              sortOptions: field.admin.sortOptions,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            cellComponentProps.relationTo = field.relationTo
            fieldComponentPropsBase = relationshipField
            break
          }
          case 'radio': {
            const radioField: RadioFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              layout: field.admin?.layout,
              options: fieldOptions,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            cellComponentProps.options = fieldOptions
            fieldComponentPropsBase = radioField
            break
          }
          case 'richText': {
            const richTextField: RichTextComponentProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            if (!field?.editor) {
              throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
            }

            if (typeof field?.editor === 'function') {
              throw new Error('Attempted to access unsanitized rich text editor.')
            }

            const RichTextFieldComponent = field.editor.FieldComponent
            const RichTextCellComponent = field.editor.CellComponent

            if (typeof field.editor.generateComponentMap === 'function') {
              const result = field.editor.generateComponentMap({
                WithServerSideProps,
                config,
                i18n,
                payload,
                schemaPath: path,
              })

              richTextField.richTextComponentMap = result
              cellComponentProps.richTextComponentMap = result
            }

            if (RichTextFieldComponent) {
              CustomFieldComponent = RichTextFieldComponent
            }

            if (RichTextCellComponent) {
              CustomCellComponent = RichTextCellComponent
            }

            fieldComponentPropsBase = richTextField

            break
          }
          case 'row': {
            const rowField: Omit<RowFieldProps, 'indexPath'> = {
              ...baseFieldProps,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              fieldMap: mapFields({
                WithServerSideProps,
                config,
                disableAddingID: true,
                fieldSchema: field.fields,
                filter,
                i18n,
                parentPath: path,
                payload,
                readOnly: readOnlyOverride,
              }),
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = rowField
            break
          }
          case 'tabs': {
            // `tabs` fields require a field map of each of its tab's nested fields
            const tabs = field.tabs.map((tab) => {
              const tabFieldMap = mapFields({
                WithServerSideProps,
                config,
                disableAddingID: true,
                fieldSchema: tab.fields,
                filter,
                i18n,
                parentPath: path,
                payload,
                readOnly: readOnlyOverride,
              })

              const reducedTab: MappedTab = {
                name: 'name' in tab ? tab.name : undefined,
                fieldMap: tabFieldMap,
                label: tab.label,
              }

              return reducedTab
            })

            const tabsField: Omit<TabsFieldProps, 'indexPath'> = {
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

            fieldComponentPropsBase = tabsField
            break
          }
          case 'text': {
            const textField: TextFieldProps = {
              ...baseFieldProps,
              name: field.name,
              className: field.admin?.className,
              disabled: field.admin?.disabled,
              hasMany: field.hasMany,
              maxLength: field.maxLength,
              minLength: field.minLength,
              placeholder: field.admin?.placeholder,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            fieldComponentPropsBase = textField
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

            fieldComponentPropsBase = textareaField
            break
          }
          case 'ui': {
            fieldComponentPropsBase = baseFieldProps
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

            cellComponentProps.relationTo = field.relationTo
            cellComponentProps.displayPreview = field.displayPreview
            fieldComponentPropsBase = uploadField
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
              options: fieldOptions,
              readOnly: field.admin?.readOnly,
              required: field.required,
              style: field.admin?.style,
              width: field.admin?.width,
            }

            cellComponentProps.options = fieldOptions
            fieldComponentPropsBase = selectField
            break
          }
          default: {
            break
          }
        }

        const labelProps: LabelProps = {
          type: field.type,
          label,
          required: 'required' in field ? field.required : undefined,
          schemaPath: path,
        }

        const CustomLabelComponent =
          ('admin' in field &&
            field.admin?.components &&
            'Label' in field.admin.components &&
            field.admin.components?.Label) ||
          undefined

        // If we return undefined here (so if no CUSTOM label component is set),
        // the field client component is responsible for falling back to the default label
        let CustomLabel: React.ReactNode =
          CustomLabelComponent !== undefined ? (
            <WithServerSideProps Component={CustomLabelComponent} {...(labelProps || {})} />
          ) : undefined

        switch (field.type) {
          case 'array': {
            let CustomRowLabel: React.ReactNode

            if (
              'admin' in field &&
              field.admin.components &&
              'RowLabel' in field.admin.components &&
              field.admin.components.RowLabel
            ) {
              const CustomRowLabelComponent = field.admin.components.RowLabel
              CustomRowLabel = (
                <WithServerSideProps Component={CustomRowLabelComponent} {...(labelProps || {})} />
              )
            }

            // @ts-expect-error
            fieldComponentPropsBase.CustomRowLabel = CustomRowLabel

            break
          }

          case 'collapsible': {
            let CustomCollapsibleLabel: React.ReactNode

            if (
              field?.admin?.components &&
              'RowLabel' in field.admin.components &&
              field?.admin?.components?.RowLabel
            ) {
              const CustomCollapsibleLabelComponent = field.admin.components.RowLabel
              CustomCollapsibleLabel = (
                <WithServerSideProps
                  Component={CustomCollapsibleLabelComponent}
                  {...(labelProps || {})}
                />
              )
            }

            CustomLabel = CustomCollapsibleLabel

            break
          }

          default:
            break
        }

        let description = undefined

        if (field.admin && 'description' in field.admin) {
          if (
            typeof field.admin?.description === 'string' ||
            typeof field.admin?.description === 'object'
          ) {
            description = field.admin.description
          } else if (typeof field.admin?.description === 'function') {
            description = field.admin?.description({ t })
          }
        }

        const descriptionProps: FieldDescriptionProps = {
          type: field.type,
          description,
        }

        let CustomDescriptionComponent = undefined

        if (
          field.admin?.components &&
          'Description' in field.admin.components &&
          field.admin.components?.Description
        ) {
          CustomDescriptionComponent = field.admin.components.Description
        } else if (description) {
          CustomDescriptionComponent = FieldDescription
        }

        const CustomDescription =
          CustomDescriptionComponent !== undefined ? (
            <WithServerSideProps
              Component={CustomDescriptionComponent}
              {...(descriptionProps || {})}
            />
          ) : undefined

        const errorProps = {
          path,
        }

        const CustomErrorComponent =
          ('admin' in field &&
            field.admin?.components &&
            'Error' in field.admin.components &&
            field.admin?.components?.Error) ||
          undefined

        const CustomError =
          CustomErrorComponent !== undefined ? (
            <WithServerSideProps Component={CustomErrorComponent} {...(errorProps || {})} />
          ) : undefined

        const fieldComponentProps: FieldComponentProps = {
          ...fieldComponentPropsBase,
          type: undefined,
          CustomDescription,
          CustomError,
          CustomLabel,
          descriptionProps,
          errorProps,
          labelProps,
        }

        const reducedField: MappedField = {
          name: 'name' in field ? field.name : undefined,
          type: field.type,
          CustomCell: CustomCellComponent ? (
            <WithServerSideProps Component={CustomCellComponent} {...cellComponentProps} />
          ) : undefined,
          CustomField: CustomFieldComponent ? (
            <WithServerSideProps Component={CustomFieldComponent} {...fieldComponentPropsBase} />
          ) : undefined,
          cellComponentProps,
          custom: field?.admin?.custom,
          disableBulkEdit:
            'admin' in field && 'disableBulkEdit' in field.admin && field.admin.disableBulkEdit,
          disableListColumn:
            'admin' in field && 'disableListColumn' in field.admin && field.admin.disableListColumn,
          disableListFilter:
            'admin' in field && 'disableListFilter' in field.admin && field.admin.disableListFilter,
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
    // TODO: For all fields (not just this one) we need to add the name to both .fieldComponentPropsBase.name AND .name. This can probably be improved
    result.push({
      name: 'id',
      type: payload.db.defaultIDType === 'number' ? 'number' : 'text',
      CustomField: null,
      cellComponentProps: {
        name: 'id',
        schemaPath: 'id',
      },
      disableBulkEdit: true,
      fieldComponentProps: {
        name: 'id',
        type: undefined,
        label: 'ID',
      },
      fieldIsPresentational: false,
      isFieldAffectingData: true,
      isHidden: true,
      localized: undefined,
    })
  }

  return result
}
