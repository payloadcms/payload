import type { FormFieldBase } from 'payload'

import type { FieldMap } from '../forms/FieldMap.js'

export type RowFieldProps = {
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  path?: string
  type?: 'row'
  width?: string
} & FormFieldBase
