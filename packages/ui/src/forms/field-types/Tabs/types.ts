import type { FieldPermissions } from 'payload/auth'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions: FieldPermissions
  name?: string
}
