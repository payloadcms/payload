import type { FormFieldBase } from 'payload'

import type { FieldMap } from '../../providers/ComponentMap/buildComponentMap/types.js'

export type RowFieldProps = {
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  path?: string
  width?: string
} & FormFieldBase
