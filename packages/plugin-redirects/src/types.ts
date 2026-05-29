import type { CollectionConfig, Field, SelectField } from 'payload'

import type { redirectTypes } from './redirectTypes.js'
export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export type RedirectsPluginConfig = {
  collections?: string[]
  overrides?: Partial<Omit<CollectionConfig, 'fields'>> & { fields?: FieldsOverride }
  redirectTypeFieldOverride?: Partial<SelectField>
  redirectTypes?: (typeof redirectTypes)[number][]
}
