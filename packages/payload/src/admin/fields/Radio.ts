import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { RadioFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RadioFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'radio' }>

export type RadioFieldProps = {
  readonly field: RadioFieldClient
  readonly onChange?: OnChange
  readonly validate?: RadioFieldValidation
  readonly value?: string
} & FormFieldBase

export type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelComponent = LabelComponent<'radio'>

export type RadioFieldDescriptionComponent = DescriptionComponent<'radio'>

export type RadioFieldErrorComponent = ErrorComponent<'radio'>
