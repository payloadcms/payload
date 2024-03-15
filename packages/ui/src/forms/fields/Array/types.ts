import type { FieldPermissions } from 'payload/auth'
import type { ArrayField, RowLabel } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type ArrayFieldProps = FormFieldBase & {
  forceRender?: boolean
  indexPath: string
  label?: RowLabel
  labels?: ArrayField['labels']
  maxRows?: ArrayField['maxRows']
  minRows?: ArrayField['minRows']
  name?: string
  permissions: FieldPermissions
}
