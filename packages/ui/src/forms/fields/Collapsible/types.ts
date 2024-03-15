import type { FieldMap } from '@payloadcms/ui'
import type { FieldPermissions } from 'payload/auth'
import type { FieldTypes } from 'payload/config'
import type { FieldBase } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type CollapsibleFieldProps = FormFieldBase & {
  fieldMap: FieldMap
  fieldTypes: FieldTypes
  indexPath: string
  initCollapsed?: boolean
  label?: FieldBase['label']
  permissions: FieldPermissions
  width?: string
}
