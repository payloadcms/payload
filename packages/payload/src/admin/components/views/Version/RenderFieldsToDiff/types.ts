import type { FieldPermissions } from '../../../../../auth'
import type { Field } from '../../../../../fields/config/types'
import type { FieldComponents } from './fields/types'

export type Props = {
  comparison: Record<string, any>
  fieldComponents: FieldComponents
  fieldPermissions: Record<string, FieldPermissions>
  fields: Field[]
  locales: string[]
  version: Record<string, any>
}
