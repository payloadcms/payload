import type { TFunction } from '@payloadcms/translations'
import type {
  ClientFieldConfig,
  CreateMappedComponent,
  Field,
  ServerOnlyFieldAdminProperties,
  ServerOnlyFieldProperties,
} from 'payload'

export const createClientFieldConfig = ({
  createMappedComponent,
  field: incomingField,
  t,
}: {
  createMappedComponent: CreateMappedComponent
  field: Field
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
    // `fields`
    // `blocks`
    // `tabs`
    // `admin`
    // are all handled separately
  ]

  serverOnlyFieldProperties.forEach((key) => {
    if (key in field) {
      delete field[key]
    }
  })

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

  if ('fields' in field) {
    field.fields = createClientFieldConfigs({
      createMappedComponent,
      fields: field.fields as any as Field[], // invert the type
      t,
    })
  }

  if ('blocks' in field) {
    field.blocks = field.blocks?.map((block) => {
      const sanitized = { ...block }
      sanitized.fields = createClientFieldConfigs({
        createMappedComponent,
        fields: sanitized.fields,
        t,
      })
      return sanitized
    })
  }

  if ('tabs' in field) {
    // @ts-expect-error
    field.tabs = field.tabs.map((tab) => createClientFieldConfig({ field: tab, t }))
  }

  if ('admin' in field) {
    field.admin = { ...field.admin }

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
      Cell: createMappedComponent(incomingField.admin?.components?.Cell),
      Field: createMappedComponent(incomingField.admin?.components?.Field),
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
}

export const createClientFieldConfigs = ({
  createMappedComponent,
  fields,
  t,
}: {
  createMappedComponent: CreateMappedComponent
  fields: Field[]
  t: TFunction
}): ClientFieldConfig[] =>
  fields.map((field) => createClientFieldConfig({ createMappedComponent, field, t }))
