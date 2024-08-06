import type { NumberField } from '../../fields/config/types.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type NumberFieldProps = {
  hasMany?: boolean
  max?: number
  maxRows?: number
  min?: number
  name?: string
  onChange?: (e: number) => void
  path?: string
  placeholder?: NumberField['admin']['placeholder']
  step?: number
  validate?: NumberFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type NumberFieldLabelComponent = LabelComponent<'number'>

export type NumberFieldDescriptionComponent = DescriptionComponent<'number'>

export type NumberFieldErrorComponent = ErrorComponent<'number'>
