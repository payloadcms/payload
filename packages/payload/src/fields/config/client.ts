import type { Field, FieldBase } from '../../fields/config/types.js'

export type ClientFieldConfig = Omit<Field, 'access' | 'defaultValue' | 'hooks' | 'validate'>

export type ServerOnlyFieldProperties =
  | 'editor' // This is a `richText` only property
  | 'filterOptions' // This is a `relationship` and `upload` only property
  | 'label'
  | keyof Pick<FieldBase, 'access' | 'defaultValue' | 'hooks' | 'validate'>

export type ServerOnlyFieldAdminProperties = keyof Pick<
  FieldBase['admin'],
  'components' | 'condition' | 'description'
>

export const createClientFieldConfig = (f: Field) => {
  const field = { ...f }

  const serverOnlyFieldProperties: Partial<ServerOnlyFieldProperties>[] = [
    'hooks',
    'access',
    'validate',
    'defaultValue',
    'label',
    'filterOptions', // This is a `relationship` and `upload` only property
    'editor', // This is a `richText` only property
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

  if ('fields' in field) {
    field.fields = createClientFieldConfigs(field.fields)
  }

  if ('blocks' in field) {
    field.blocks = field.blocks.map((block) => {
      const sanitized = { ...block }
      sanitized.fields = createClientFieldConfigs(sanitized.fields)
      return sanitized
    })
  }

  if ('tabs' in field) {
    // @ts-expect-error
    field.tabs = field.tabs.map((tab) => createClientFieldConfig(tab))
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

export const createClientFieldConfigs = (fields: Field[]): Field[] =>
  fields.map(createClientFieldConfig)
