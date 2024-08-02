import type { I18nClient } from '@payloadcms/translations'
import type {
  ArrayFieldProps,
  BlocksFieldProps,
  CellComponentProps,
  CheckboxFieldProps,
  CodeFieldProps,
  CollapsibleFieldProps,
  CreateMappedComponent,
  DateFieldProps,
  EmailFieldProps,
  ErrorProps,
  Field,
  FieldComponentProps,
  FieldDescriptionProps,
  FieldMap,
  FieldTypes,
  FieldWithPath,
  FormFieldBase,
  GroupFieldProps,
  ImportMap,
  JSONFieldProps,
  LabelProps,
  MappedComponent,
  MappedField,
  MappedTab,
  NumberFieldProps,
  Option,
  PayloadComponent,
  PointFieldProps,
  RadioFieldProps,
  ReducedBlock,
  RelationshipFieldProps,
  RichTextComponentProps,
  RichTextGenerateComponentMap,
  RowFieldProps,
  SanitizedConfig,
  SelectFieldProps,
  TabsFieldProps,
  TextFieldProps,
  TextareaFieldProps,
  UploadFieldProps,
} from 'payload'
import type React from 'react'

import { MissingEditorProp, deepCopyObject } from 'payload'
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/shared'

import type { FieldTypesComponents } from '../../../fields/index.js'

import {
  ArrayField,
  BlocksField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  ConfirmPasswordField,
  DateCondition,
  DateTimeField,
  DefaultCell,
  EmailField,
  FieldDescription,
  GroupField,
  HiddenField,
  JSONField,
  NumberCondition,
  NumberField,
  PasswordField,
  PointField,
  RadioGroupField,
  RelationshipCondition,
  RelationshipField,
  RichTextField,
  RowField,
  SelectCondition,
  SelectField,
  TabsField,
  TextCondition,
  TextField,
  TextareaField,
  UIField,
  UploadField,
  // eslint-disable-next-line payload/no-imports-from-exports-dir
} from '../../../exports/client/index.js'
import { getComponent } from '../../Config/createClientConfig/getComponent.js'

// Need to recreate fieldComponents here, as we cannot access it from the client bundle ("cannot "dot" into "fieldComponents")
const fieldComponents: FieldTypesComponents = {
  array: ArrayField,
  blocks: BlocksField,
  checkbox: CheckboxField,
  code: CodeField,
  collapsible: CollapsibleField,
  confirmPassword: ConfirmPasswordField,
  date: DateTimeField,
  email: EmailField,
  group: GroupField,
  hidden: HiddenField,
  json: JSONField,
  number: NumberField,
  password: PasswordField,
  point: PointField,
  radio: RadioGroupField,
  relationship: RelationshipField,
  richText: RichTextField,
  row: RowField,
  select: SelectField,
  tabs: TabsField,
  text: TextField,
  textarea: TextareaField,
  ui: UIField,
  upload: UploadField,
}

function generateFieldPath(parentPath, name) {
  let tabPath = parentPath || ''
  if (parentPath && name) {
    tabPath = `${parentPath}.${name}`
  } else if (!parentPath && name) {
    tabPath = name
  }

  return tabPath
}

function prepareCustomComponentProps(
  props: {
    [key: string]: any
  } & FieldComponentProps,
) {
  return deepCopyObject({
    ...props,
    fieldMap: undefined,
    richTextComponentMap: undefined,
    rows: undefined,
    tabs: undefined,
  })
}

export const mapFields = (args: {
  config: SanitizedConfig
  createMappedComponent: CreateMappedComponent
  /**
   * If mapFields is used outside of collections, you might not want it to add an id field
   */
  disableAddingID?: boolean
  fieldSchema: FieldWithPath[]
  filter?: (field: Field) => boolean
  i18n: I18nClient
  importMap: ImportMap
  parentPath?: string
  readOnly?: boolean
}): FieldMap => {
  const {
    config,
    createMappedComponent,
    disableAddingID,
    fieldSchema,
    filter,
    i18n,
    i18n: { t },
    importMap,
    parentPath,
    readOnly: readOnlyOverride,
  } = args

  const result: FieldMap = fieldSchema.reduce((acc, field): FieldMap => {
    const fieldIsPresentational = fieldIsPresentationalOnly(field)
    let CustomFieldComponent: { ReactComponent: React.FC } | PayloadComponent =
      field.admin?.components?.Field

    let CustomCellComponent: { ReactComponent: React.FC } | PayloadComponent =
      field.admin?.components?.Cell

    const isHidden = field?.admin && 'hidden' in field.admin && field.admin.hidden

    if (fieldIsPresentational || (!field?.hidden && field?.admin?.disabled !== true)) {
      if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
        if (isHidden) {
          if (CustomFieldComponent) {
            CustomFieldComponent = {
              ReactComponent: HiddenField,
            }
          }
        }

        const isFieldAffectingData = fieldAffectsData(field)

        const path = generateFieldPath(
          parentPath,
          isFieldAffectingData && 'name' in field ? field.name : '',
        )

        const AfterInput = createMappedComponent(
          field.admin &&
            'components' in field.admin &&
            'afterInput' in field.admin.components &&
            field?.admin?.components?.afterInput,
        )

        const BeforeInput = createMappedComponent(
          field?.admin?.components &&
            'beforeInput' in field.admin.components &&
            field.admin.components.beforeInput,
        )

        let label: FormFieldBase['label'] = undefined
        if ('label' in field) {
          if (typeof field.label === 'string' || typeof field.label === 'object') {
            label = field.label
          } else if (typeof field.label === 'function') {
            label = field.label({ t })
          }
        }

        const valueFields: Partial<{
          [key in FieldTypes]: React.FC
        }> = {
          date: DateCondition,
          number: NumberCondition,
          relationship: RelationshipCondition,
          select: SelectCondition,
          text: TextCondition,
        }
        const Filter = createMappedComponent(
          field?.admin?.components &&
            'Filter' in field.admin.components &&
            field.admin?.components?.Filter,
          undefined,
          valueFields[field.type] || valueFields.text,
        )

        // These fields are shared across all field types even if they are not used in the default field, as the custom field component can use them
        const baseFieldProps: FormFieldBase = {
          AfterInput,
          BeforeInput,
          Filter,
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
                config,
                createMappedComponent,
                fieldSchema: field.fields,
                filter,
                i18n,
                importMap,
                parentPath: path,
                readOnly: readOnlyOverride,
                // TODO: verify if we need disableAddingID here. If not, explicitly set it
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
                config,
                createMappedComponent,
                fieldSchema: block.fields,
                filter,
                i18n,
                importMap,
                parentPath: `${path}.${block.slug}`,
                readOnly: readOnlyOverride,
                // TODO: verify if we need disableAddingID here. If not, explicitly set it
              })

              const reducedBlock: ReducedBlock = {
                slug: block.slug,
                LabelComponent: createMappedComponent(block.admin?.components?.Label),
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
                config,
                createMappedComponent,
                disableAddingID: true,
                fieldSchema: field.fields,
                filter,
                i18n,
                importMap,
                parentPath: path,
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
                config,
                createMappedComponent,
                disableAddingID: true,
                fieldSchema: field.fields,
                filter,
                i18n,
                importMap,
                parentPath: path,
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

            if (field.editor.generateComponentMap) {
              const { Component: generateComponentMap, serverProps } = getComponent({
                importMap,
                payloadComponent: field.editor.generateComponentMap,
              })

              const actualGenerateComponentMap: RichTextGenerateComponentMap = (
                generateComponentMap as any
              )(serverProps)

              const result = actualGenerateComponentMap({
                config,
                createMappedComponent,
                field,
                i18n,
                importMap,
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
                config,
                createMappedComponent,
                disableAddingID: true,
                fieldSchema: field.fields,
                filter,
                i18n,
                importMap,
                parentPath: path,
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
                config,
                createMappedComponent,
                disableAddingID: true,
                fieldSchema: tab.fields,
                filter,
                i18n,
                importMap,
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

        const labelProps: Omit<LabelProps, 'type'> = prepareCustomComponentProps({
          ...fieldComponentPropsBase,
          type: undefined,
          schemaPath: path,
        })

        let CustomLabel: MappedComponent = createMappedComponent(
          field?.admin?.components &&
            'Label' in field.admin.components &&
            field?.admin?.components?.Label,
          labelProps,
        )

        switch (field.type) {
          case 'array': {
            const CustomRowLabel = createMappedComponent(
              field?.admin?.components &&
                'RowLabel' in field.admin.components &&
                field?.admin?.components?.RowLabel,
              labelProps,
            )

            // @ts-expect-error
            fieldComponentPropsBase.CustomRowLabel = CustomRowLabel

            break
          }

          case 'collapsible': {
            CustomLabel = createMappedComponent(
              field?.admin?.components &&
                'RowLabel' in field.admin.components &&
                field?.admin?.components?.RowLabel,
              labelProps,
            )

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

        const descriptionProps: FieldDescriptionProps = prepareCustomComponentProps({
          ...fieldComponentPropsBase,
          type: undefined,
          description,
        })

        const CustomDescription = createMappedComponent(
          field.admin?.components &&
            'Description' in field.admin.components &&
            field.admin?.components?.Description,
          descriptionProps,
          FieldDescription,
        )

        const errorProps: ErrorProps = prepareCustomComponentProps({
          ...fieldComponentPropsBase,
          type: undefined,
          path,
        })

        const CustomError = createMappedComponent(
          field?.admin?.components &&
            'Error' in field.admin.components &&
            field.admin?.components?.Error,
          errorProps,
          FieldDescription,
        )

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

        const DefaultField = isHidden ? HiddenField : fieldComponents[field.type]

        const reducedField: MappedField = {
          name: 'name' in field ? field.name : undefined,
          type: field.type,
          Cell: createMappedComponent(CustomCellComponent, cellComponentProps, DefaultCell),
          Field: createMappedComponent(CustomFieldComponent, fieldComponentPropsBase, DefaultField),
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

    const idCellComponentProps = {
      name: 'id',
      schemaPath: 'id',
    }

    result.push({
      name: 'id',
      type: 'text',
      Cell: createMappedComponent(undefined, idCellComponentProps, DefaultCell),
      Field: null,
      cellComponentProps: idCellComponentProps,
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
