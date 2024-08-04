import type { TFunction } from '@payloadcms/translations'
import type {
  ClientFieldConfig,
  CreateMappedComponent,
  Field,
  FieldTypes,
  ServerOnlyFieldAdminProperties,
  ServerOnlyFieldProperties,
} from 'payload'

import { fieldAffectsData, fieldIsPresentationalOnly, fieldIsSidebar } from 'payload/shared'

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
  FieldError,
  FieldLabel,
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

const valueFields: Partial<{
  [key in FieldTypes]: React.FC
}> = {
  date: DateCondition,
  number: NumberCondition,
  relationship: RelationshipCondition,
  select: SelectCondition,
  text: TextCondition,
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

export const createClientFieldConfig = ({
  createMappedComponent,
  field: incomingField,
  parentPath,
  t,
}: {
  createMappedComponent: CreateMappedComponent
  field: Field
  parentPath?: string
  t: TFunction
}): ClientFieldConfig => {
  const field: ClientFieldConfig = { ...(incomingField as any as ClientFieldConfig) } // invert the type

  const serverOnlyFieldProperties: Partial<ServerOnlyFieldProperties>[] = [
    'hooks',
    'access',
    'validate',
    'defaultValue',
    'label',
    'filterOptions', // This is a `relationship` and `upload` only property
    'editor', // This is a `richText` only property
    'custom',
    'typescriptSchema',
    'dbName', // can be a function
    'enumName', // can be a function
    // the following props are handled separately (see below):
    // `fields`
    // `blocks`
    // `tabs`
    // `admin`
  ]

  serverOnlyFieldProperties.forEach((key) => {
    if (key in field) {
      delete field[key]
    }
  })

  field._fieldIsPresentational = fieldIsPresentationalOnly(field)
  field._isFieldAffectingData = fieldAffectsData(field)
  field._isSidebar = fieldIsSidebar(field)

  const isHidden = 'hidden' in field && field?.hidden
  const isHiddenFromAdmin = field?.admin && 'hidden' in field.admin && field.admin.hidden
  const disabledFromAdmin = field?.admin && 'disabled' in field.admin && field.admin.disabled

  if (
    field._fieldIsPresentational ||
    (field._isFieldAffectingData && !(isHidden || disabledFromAdmin))
  ) {
    if (isHiddenFromAdmin) {
      // TODO: set to Hidden field
    }

    field._path = generateFieldPath(
      parentPath,
      field._isFieldAffectingData && 'name' in field ? field.name : '',
    )

    if ('options' in field && Array.isArray(field.options)) {
      field.options = field.options.map((option) => {
        if (typeof option === 'object' && typeof option.label === 'function') {
          return {
            label: option.label({ t }),
            value: option.value,
          }
        }

        return option
      })
    }

    if (
      field.type === 'array' ||
      field.type === 'group' ||
      field.type === 'collapsible' ||
      field.type === 'row'
    ) {
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
      field.fields = createClientFieldConfigs({
        createMappedComponent,
        disableAddingID: field.type !== 'array',
        // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
        fields: field.fields as any as Field[], // invert the type
        parentPath: field._path,
        t,
      })
    }

    if (field.type === 'blocks') {
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
      field.blocks = field.blocks?.map((block) => {
        const sanitized = { ...block }
        sanitized.fields = createClientFieldConfigs({
          createMappedComponent,
          fields: sanitized.fields as Field[], // invert the type
          parentPath: field._path,
          t,
        })
        return sanitized
      })
    }

    if (field.type === 'tabs') {
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
      field.tabs = createClientFieldConfigs({
        createMappedComponent,
        // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference
        disableAddingID: true,
        fields: field.tabs as any as Field[], // invert the type
        parentPath: field._path,
        t,
      })
    }

    field.admin = { ...(field.admin || ({} as any)) }

    const serverOnlyFieldAdminProperties: Partial<ServerOnlyFieldAdminProperties>[] = ['condition']

    serverOnlyFieldAdminProperties.forEach((key) => {
      if (key in field.admin) {
        delete field.admin[key]
      }
    })

    if (incomingField.admin && 'description' in incomingField.admin) {
      if (
        typeof incomingField.admin?.description === 'string' ||
        typeof incomingField.admin?.description === 'object'
      ) {
        field.admin.description = incomingField.admin.description
      } else if (typeof incomingField.admin?.description === 'function') {
        field.admin.description = incomingField.admin?.description({ t })
      }
    }

    field.admin.components = {
      Cell: createMappedComponent(
        'admin' in incomingField &&
          'components' in incomingField.admin &&
          'Cell' in incomingField.admin.components &&
          incomingField.admin.components.Cell,
        undefined,
        DefaultCell,
      ),
      Description: createMappedComponent(
        'admin' in incomingField &&
          'components' in incomingField.admin &&
          'Description' in incomingField.admin.components &&
          incomingField.admin.components.Description,
        undefined,
        FieldDescription,
      ),
      Error: createMappedComponent(
        'admin' in incomingField &&
          'components' in incomingField.admin &&
          'Error' in incomingField.admin.components &&
          incomingField.admin.components.Error,
        undefined,
        FieldError,
      ),
      Field: createMappedComponent(
        'admin' in incomingField &&
          'components' in incomingField.admin &&
          'Field' in incomingField.admin.components &&
          incomingField.admin.components.Field,
        undefined,
        fieldComponents[incomingField.type],
      ),
      Filter: createMappedComponent(
        'admin' in incomingField &&
          'components' in incomingField.admin &&
          'Filter' in incomingField.admin.components &&
          incomingField.admin.components.Filter,
        undefined,
        valueFields[field.type] || valueFields.text,
      ),
      Label: createMappedComponent(
        'admin' in incomingField &&
          'components' in incomingField.admin &&
          'Label' in incomingField.admin.components &&
          incomingField.admin.components.Label,
        undefined,
        FieldLabel,
      ),
      ...('admin' in incomingField &&
      'components' in incomingField.admin &&
      'beforeInput' in incomingField.admin.components
        ? {
            beforeInput: createMappedComponent(incomingField.admin?.components?.beforeInput),
          }
        : {}),
      ...('admin' in incomingField &&
      'components' in incomingField.admin &&
      'afterInput' in incomingField.admin.components
        ? {
            afterInput: createMappedComponent(incomingField.admin?.components?.afterInput),
          }
        : {}),
    }

    return field
  }

  return null
}

export const createClientFieldConfigs = ({
  createMappedComponent,
  disableAddingID,
  fields,
  parentPath,
  t,
}: {
  createMappedComponent: CreateMappedComponent
  disableAddingID?: boolean
  fields: Field[]
  parentPath?: string
  t: TFunction
}): ClientFieldConfig[] => {
  const result = fields
    .map((field) => createClientFieldConfig({ createMappedComponent, field, parentPath, t }))
    .filter(Boolean)

  const hasID =
    result.findIndex((f) => 'name' in f && f._isFieldAffectingData && f.name === 'id') > -1

  if (!disableAddingID && !hasID) {
    result.push({
      name: 'id',
      type: 'text',
      _fieldIsPresentational: false,
      _isFieldAffectingData: true,
      admin: {
        components: {
          Cell: createMappedComponent(undefined, undefined, DefaultCell),
          Field: null,
        },
        disableBulkEdit: true,
      },
      hidden: true,
      localized: undefined,
    })
  }

  return result
}
