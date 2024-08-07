import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { JSONFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type JSONFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'json' }>

export type JSONFieldProps = {
  readonly field: JSONFieldClient
  readonly validate?: JSONFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type JSONFieldLabelComponent = LabelComponent<'json'>

export type JSONFieldDescriptionComponent = DescriptionComponent<'json'>

export type JSONFieldErrorComponent = ErrorComponent<'json'>
