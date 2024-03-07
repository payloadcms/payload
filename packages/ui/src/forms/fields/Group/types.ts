import type { FieldPermissions } from 'payload/auth'

import type { FormFieldBase } from '../shared.d.ts'

export type Props = FormFieldBase & {
  forceRender?: boolean
  hideGutter?: boolean
  indexPath: string
  name?: string
  permissions: FieldPermissions
}
