import type { FieldPermissions } from 'payload/auth'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  forceRender?: boolean
  indexPath: string
  label: false | string
  path?: string
  permissions: FieldPermissions
  name?: string
}
