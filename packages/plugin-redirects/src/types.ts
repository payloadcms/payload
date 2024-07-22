import type { CollectionConfig, Field } from 'payload'

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export type RedirectsPluginConfig = {
  collections?: string[]
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}
