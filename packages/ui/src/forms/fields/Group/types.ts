import type { FieldMap } from '@payloadcms/ui'
import type { FieldPermissions } from 'payload/auth'
import type { FieldBase } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type GroupFieldProps = FormFieldBase & {
  fieldMap: FieldMap
  forceRender?: boolean
  hideGutter?: boolean
  indexPath: string
  label?: FieldBase['label']
  name?: string
  permissions: FieldPermissions
  width?: string
}
