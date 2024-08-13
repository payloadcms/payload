import type { MarkOptional } from 'ts-essentials'

import type { EmailFieldClient } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type EmailFieldProps = {
  readonly autoComplete?: string
  readonly field: MarkOptional<EmailFieldClient, 'type'>
  readonly validate?: EmailFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type EmailFieldLabelComponent = LabelComponent<'email'>

export type EmailFieldDescriptionComponent = DescriptionComponent<'email'>

export type EmailFieldErrorComponent = ErrorComponent<'email'>
