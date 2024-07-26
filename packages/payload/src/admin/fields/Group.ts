import type { FieldMap } from '../forms/FieldMap.js'
import type { FormFieldBase } from '../types.js'

export type GroupFieldProps = {
  fieldMap: FieldMap
  forceRender?: boolean
  hideGutter?: boolean
  name?: string
  type?: 'group'
  width?: string
} & FormFieldBase
