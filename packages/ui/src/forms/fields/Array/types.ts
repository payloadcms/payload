import type { FieldPermissions } from 'payload/auth'

import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  forceRender?: boolean
  indexPath: string
  label: false | string
  name?: string
  permissions: FieldPermissions
}
