import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type NumberFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'number' }>

export type NumberFieldProps = {
  readonly field: NumberFieldClient
  readonly onChange?: (e: number) => void
  readonly validate?: NumberFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type NumberFieldLabelComponent = LabelComponent<'number'>

export type NumberFieldDescriptionComponent = DescriptionComponent<'number'>

export type NumberFieldErrorComponent = ErrorComponent<'number'>
