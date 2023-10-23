import type { FieldPermissions } from '../../../../../auth'
import type { Field } from '../../../../../fields/config/types'

export type Props = {
  comparison: Record<string, any>
  fieldPermissions: Record<string, FieldPermissions>
  fields: Field[]
  locales: string[]
  version: Record<string, any>
}
