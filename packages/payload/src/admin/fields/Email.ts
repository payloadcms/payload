import type { MarkOptional } from 'ts-essentials'

import type { EmailFieldClient } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldLabelClientComponent,
  FormFieldBase,
} from '../types.js'

type EmailFieldClientWithoutType = MarkOptional<EmailFieldClient, 'type'>

export type EmailFieldProps = {
  readonly autoComplete?: string
  readonly validate?: EmailFieldValidation
} & Omit<FormFieldBase<EmailFieldClient>, 'validate'>

export type EmailFieldLabelClientComponent = FieldLabelClientComponent<EmailFieldClientWithoutType>

export type EmailFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<EmailFieldClientWithoutType>

export type EmailFieldErrorClientComponent = FieldErrorClientComponent<EmailFieldClientWithoutType>
