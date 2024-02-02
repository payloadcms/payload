import type { FieldPermissions } from 'payload/auth'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  name?: string
  forceRender?: boolean
  indexPath: string
  permissions: FieldPermissions
}
