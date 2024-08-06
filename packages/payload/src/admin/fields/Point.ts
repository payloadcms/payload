import type { PointFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type PointFieldProps = {
  name?: string
  path?: string
  placeholder?: string
  step?: number
  validate?: PointFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type PointFieldLabelComponent = LabelComponent<'point'>

export type PointFieldDescriptionComponent = DescriptionComponent<'point'>

export type PointFieldErrorComponent = ErrorComponent<'point'>
