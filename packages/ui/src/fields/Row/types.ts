import type { FieldPermissions } from 'payload'

import type { FieldMap } from '../../providers/ComponentMap/buildComponentMap/types.js'
import type { FormFieldBase } from '../shared/index.js'

export type RowFieldProps = {
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions?: FieldPermissions
  width?: string
} & FormFieldBase
