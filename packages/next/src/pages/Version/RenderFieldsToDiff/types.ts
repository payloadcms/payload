import type { FieldPermissions } from 'payload/auth'
import type { Field } from 'payload/types'
import type { FieldComponents } from './fields/types'

export type Props = {
  comparison: Record<string, any>
  fieldComponents: FieldComponents
  fieldPermissions: Record<string, FieldPermissions>
  fields: Field[]
  locales: string[]
  version: Record<string, any>
}
