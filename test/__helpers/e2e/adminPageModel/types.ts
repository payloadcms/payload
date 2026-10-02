export type AdminFieldState = {
  disabled: boolean
  hidden: boolean
  readOnly: boolean
}

export type AdminFieldDescriptorBase = {
  admin?: AdminFieldState
  hidden?: true
  path: string
  required?: true
  type: string
}

export type AdminTextFieldDescriptor = {
  hasMany: boolean
  type: 'text'
} & AdminFieldDescriptorBase

export type AdminArrayFieldDescriptor = {
  fields: AdminFieldsDescriptor
  type: 'array'
} & AdminFieldDescriptorBase

export type AdminBlockDescriptor = {
  fields: AdminFieldsDescriptor
  label: string
  slug: string
}

export type AdminBlocksFieldDescriptor = {
  blocks: Record<string, AdminBlockDescriptor>
  type: 'blocks'
} & AdminFieldDescriptorBase

export type AdminGroupFieldDescriptor = {
  fields: AdminFieldsDescriptor
  type: 'group'
} & AdminFieldDescriptorBase

export type AdminRelationshipFieldDescriptor = {
  hasMany: boolean
  relationTo: string[]
  type: 'relationship'
} & AdminFieldDescriptorBase

export type AdminUnsupportedFieldDescriptor = {
  type: Exclude<string, 'array' | 'blocks' | 'group' | 'relationship' | 'text'>
} & AdminFieldDescriptorBase

export type AdminFieldDescriptor =
  | AdminArrayFieldDescriptor
  | AdminBlocksFieldDescriptor
  | AdminGroupFieldDescriptor
  | AdminRelationshipFieldDescriptor
  | AdminTextFieldDescriptor
  | AdminUnsupportedFieldDescriptor

export type AdminFieldsDescriptor = Record<string, AdminFieldDescriptor>

export type AdminCollectionDescriptor = {
  fields: AdminFieldsDescriptor
  slug: string
}

export type AdminPageModelDescriptor = {
  collections: Record<string, AdminCollectionDescriptor>
}

export type CreateAdminPageModelOptions = {
  collections: readonly string[]
}
