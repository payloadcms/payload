import type { FieldMap } from '@payloadcms/ui'
import type { FieldPermissions } from 'payload/auth'
import type { ArrayField, FieldBase, RowLabel } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type ArrayFieldProps = FormFieldBase & {
  RowLabel?: React.ReactNode
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  label?: FieldBase['label']
  labels?: ArrayField['labels']
  maxRows?: ArrayField['maxRows']
  minRows?: ArrayField['minRows']
  name?: string
  permissions: FieldPermissions
  width?: string
}
