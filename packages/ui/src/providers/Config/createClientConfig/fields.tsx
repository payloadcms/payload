import type { TFunction } from '@payloadcms/translations'
import type {
  ClientFieldConfig,
  CreateMappedComponent,
  Field,
  FieldTypes,
  ServerOnlyFieldAdminProperties,
  ServerOnlyFieldProperties,
} from 'payload'

import {
  ArrayField,
  BlocksField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  DefaultCell,
  EmailField,
  GroupField,
  HiddenField,
  JSONField,
  NumberField,
  PointField,
  RadioGroupField,
  RelationshipField,
  RichTextField,
  RowField,
  SelectField,
  TabsField,
  TextField,
  TextareaField,
  UIField,
  UploadField,
} from '@payloadcms/ui'
import { DateField } from 'packages/ui/src/elements/WhereBuilder/Condition/Date/index.js'
import { fieldAffectsData, fieldIsPresentationalOnly, fieldIsSidebar } from 'payload/shared'

const fieldComponents: {
  [key in FieldTypes]: React.FC<any>
} = {
  array: ArrayField,
  blocks: BlocksField,
  checkbox: CheckboxField,
  code: CodeField,
  collapsible: CollapsibleField,
  date: DateField,
  email: EmailField,
  group: GroupField,
  json: JSONField,
  number: NumberField,
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

    if (field.type === 'array') {
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
      field.fields = createClientFieldConfigs({
        createMappedComponent,
        // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
        fields: field.fields as any as Field[], // invert the type
        parentPath: field._path,
        t,
      })
    }

    if ('blocks' in field) {
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

    if ('tabs' in field) {
      field.tabs = createClientFieldConfigs({
        createMappedComponent,
        fields: field.tabs as any as Field[], // invert the type
        parentPath: field._path,
        t,
      })
    }

    field.admin = { ...(field.admin || ({} as any)) }

    const serverOnlyFieldAdminProperties: Partial<ServerOnlyFieldAdminProperties>[] = [
      'condition',
      'description',
    ]

    serverOnlyFieldAdminProperties.forEach((key) => {
      if (key in field.admin) {
        delete field.admin[key]
      }
    })

    const DefaultFieldComponent = isHiddenFromAdmin ? HiddenField : fieldComponents[field.type]

    field.admin.components = {
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about this property not being omitted
      Cell: createMappedComponent(incomingField.admin?.components?.Cell, null, DefaultCell),
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about this property not being omitted
      Field: createMappedComponent(
        incomingField.admin?.components?.Field,
        null,
        DefaultFieldComponent,
      ),
      ...(incomingField?.admin?.components
        ? {
            ...('Label' in incomingField.admin.components
              ? {
                  Label: createMappedComponent(incomingField.admin?.components?.Label),
                }
              : {}),
            ...('Description' in incomingField.admin.components
              ? {
                  Description: createMappedComponent(incomingField.admin?.components?.Description),
                }
              : {}),
            ...('Error' in incomingField.admin.components
              ? {
                  Error: createMappedComponent(incomingField.admin?.components?.Error),
                }
              : {}),
            ...('beforeInput' in incomingField.admin.components
              ? {
                  beforeInputL: incomingField.admin?.components?.beforeInput.map((Component) =>
                    createMappedComponent(Component),
                  ),
                }
              : {}),
            ...('afterInput' in incomingField.admin.components
              ? {
                  afterInput: incomingField.admin?.components?.afterInput.map((Component) =>
                    createMappedComponent(Component),
                  ),
                }
              : {}),
          }
        : {}),
    }

    return field
  }

  return null
}

export const createClientFieldConfigs = ({
  createMappedComponent,
  fields,
  parentPath,
  t,
}: {
  createMappedComponent: CreateMappedComponent
  fields: Field[]
  parentPath?: string
  t: TFunction
}): ClientFieldConfig[] =>
  fields
    .map((field) => createClientFieldConfig({ createMappedComponent, field, parentPath, t }))
    .filter(Boolean)
