import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type EmailFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'email' }>

export type EmailFieldProps = {
  readonly autoComplete?: string
  readonly field: EmailFieldClient
  readonly validate?: EmailFieldValidation
} & FormFieldBase

export type EmailFieldLabelComponent = LabelComponent<'email'>

export type EmailFieldDescriptionComponent = DescriptionComponent<'email'>

export type EmailFieldErrorComponent = ErrorComponent<'email'>
