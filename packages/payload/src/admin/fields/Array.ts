import type { ArrayField } from '../../fields/config/types.js'
import type { ArrayFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { FieldMap } from '../forms/FieldMap.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type ArrayFieldProps = {
  CustomRowLabel?: React.ReactNode
  fieldMap: FieldMap
  forceRender?: boolean
  isSortable?: boolean
  labels?: ArrayField['labels']
  maxRows?: ArrayField['maxRows']
  minRows?: ArrayField['minRows']
  name?: string
  validate?: ArrayFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type ArrayFieldLabelComponent = LabelComponent<'array'>

export type ArrayFieldDescriptionComponent = DescriptionComponent<'array'>

export type ArrayFieldErrorComponent = ErrorComponent<'array'>
