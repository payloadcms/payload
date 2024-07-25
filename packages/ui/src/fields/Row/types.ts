import type { FieldPermissions, FormFieldBase } from 'payload'

import type { FieldMap } from '../../providers/ComponentMap/buildComponentMap/types.js'

export type RowFieldProps = {
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions?: FieldPermissions
  width?: string
} & FormFieldBase
