import type { FieldPermissions } from 'payload/bundle'

import type { FieldMap } from '../../providers/ComponentMap/buildComponentMap/types.js'
import type { FormFieldBase } from '../shared/index.js'

export type RowFieldProps = FormFieldBase & {
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions?: FieldPermissions
  width?: string
}
