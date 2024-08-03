import type { TFunction } from '@payloadcms/translations'
import type {
  ClientFieldConfig,
  CreateMappedComponent,
  Field,
  ServerOnlyFieldAdminProperties,
  ServerOnlyFieldProperties,
} from 'payload'

import { fieldAffectsData, fieldIsPresentationalOnly, fieldIsSidebar } from 'payload/shared'

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

    field.admin.components = {
      ...(incomingField?.admin?.components
        ? {
            ...('Cell' in incomingField.admin.components
              ? {
                  Cell: createMappedComponent(incomingField?.admin?.components?.Cell),
                }
              : {}),
            ...('Field' in incomingField.admin.components
              ? {
                  Field: createMappedComponent(incomingField?.admin?.components?.Field),
                }
              : {}),
            ...('Label' in incomingField.admin.components
              ? {
                  Label: createMappedComponent(incomingField?.admin?.components?.Label),
                }
              : {}),
            ...('Description' in incomingField.admin.components
              ? {
                  Description: createMappedComponent(incomingField?.admin?.components?.Description),
                }
              : {}),
            ...('Error' in incomingField.admin.components
              ? {
                  Error: createMappedComponent(incomingField?.admin?.components?.Error),
                }
              : {}),
            ...('beforeInput' in incomingField.admin.components
              ? {
                  beforeInput: createMappedComponent(incomingField.admin?.components?.beforeInput),
                }
              : {}),
            ...('afterInput' in incomingField.admin.components
              ? {
                  afterInput: createMappedComponent(incomingField.admin?.components?.afterInput),
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
