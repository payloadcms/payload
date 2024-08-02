import type { TFunction } from '@payloadcms/translations'

import type {
  Field,
  ClientFieldConfig,
  ServerOnlyFieldAdminProperties,
  ServerOnlyFieldProperties,
} from 'payload'

export const createClientFieldConfig = ({
  field: incomingField,
  t,
}: {
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
      fields: field.fields as any as Field[], // invert the type
      t,
    })
  }

  if ('blocks' in field) {
    field.blocks = field.blocks.map((block) => {
      const sanitized = { ...block }
      sanitized.fields = createClientFieldConfigs({ fields: sanitized.fields, t })
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
      'components',
      'condition',
      'description',
    ]

    serverOnlyFieldAdminProperties.forEach((key) => {
      if (key in field.admin) {
        delete field.admin[key]
      }
    })
  }

  return field
}

export const createClientFieldConfigs = ({
  fields,
  t,
}: {
  fields: Field[]
  t: TFunction
}): ClientFieldConfig[] => fields.map((field) => createClientFieldConfig({ field, t }))
