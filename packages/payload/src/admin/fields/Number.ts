import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type NumberFieldProps = {
  readonly field: GenericClientFieldConfig<'number'>
  readonly onChange?: (e: number) => void
  readonly validate?: NumberFieldValidation
} & FormFieldBase

export type NumberFieldLabelComponent = LabelComponent<'number'>

export type NumberFieldDescriptionComponent = DescriptionComponent<'number'>

export type NumberFieldErrorComponent = ErrorComponent<'number'>
