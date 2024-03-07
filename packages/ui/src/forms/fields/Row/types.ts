import type { FieldPermissions } from 'payload/auth'
import type { FieldTypes } from 'payload/config'

import type { FormFieldBase } from '../shared.d.ts'

export type Props = FormFieldBase & {
  fieldTypes: FieldTypes
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
