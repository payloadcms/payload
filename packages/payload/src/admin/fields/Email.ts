import type { MarkOptional } from 'ts-essentials'

import type { EmailFieldClient } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type EmailFieldClientWithoutType = MarkOptional<EmailFieldClient, 'type'>

export type EmailFieldProps = {
  readonly autoComplete?: string
  readonly validate?: EmailFieldValidation
} & Omit<FormFieldBase<EmailFieldClient>, 'validate'>

export type EmailFieldLabelComponent = LabelComponent<EmailFieldClientWithoutType>

export type EmailFieldDescriptionComponent = DescriptionComponent<EmailFieldClientWithoutType>

export type EmailFieldErrorComponent = ErrorComponent<EmailFieldClientWithoutType>
