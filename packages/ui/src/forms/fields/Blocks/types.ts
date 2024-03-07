import type { FieldPermissions } from 'payload/auth'

import type { FormFieldBase } from '../shared.js'

export type Props = FormFieldBase & {
  forceRender?: boolean
  indexPath: string
  name?: string
  permissions: FieldPermissions
}
