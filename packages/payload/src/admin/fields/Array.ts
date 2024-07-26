import type { ArrayField } from '../../fields/config/types.js'
import type { FieldMap } from '../forms/FieldMap.js'
import type { FormFieldBase } from '../types.js'

export type ArrayFieldProps = {
  CustomRowLabel?: React.ReactNode
  fieldMap: FieldMap
  forceRender?: boolean
  isSortable?: boolean
  labels?: ArrayField['labels']
  maxRows?: ArrayField['maxRows']
  minRows?: ArrayField['minRows']
  name?: string
  type?: 'array'
  width?: string
} & FormFieldBase
