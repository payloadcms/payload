import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import { EmailFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type EmailFieldProps = {
  readonly autoComplete?: string
  readonly clientFieldConfig: GenericClientFieldConfig<'email'>
  readonly validate?: EmailFieldValidation
} & FormFieldBase

export type EmailFieldLabelComponent = LabelComponent<'email'>

export type EmailFieldDescriptionComponent = DescriptionComponent<'email'>

export type EmailFieldErrorComponent = ErrorComponent<'email'>
