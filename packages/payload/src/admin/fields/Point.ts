import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { PointFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type PointFieldProps = {
  readonly field: GenericClientFieldConfig<'point'>
  readonly validate?: PointFieldValidation
} & FormFieldBase

export type PointFieldLabelComponent = LabelComponent<'point'>

export type PointFieldDescriptionComponent = DescriptionComponent<'point'>

export type PointFieldErrorComponent = ErrorComponent<'point'>
