import type { FieldMap } from '@payloadcms/ui'
import type { FieldPermissions } from 'payload/auth'

import type { FormFieldBase } from '../shared.js'

export type RowFieldProps = FormFieldBase & {
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions?: FieldPermissions
  width?: string
}
