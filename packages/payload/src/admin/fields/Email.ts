import type { MarkOptional } from 'ts-essentials'

import type { EmailField, EmailFieldClient } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type EmailFieldClientWithoutType = MarkOptional<EmailFieldClient, 'type'>

export type EmailFieldProps = {
  readonly autoComplete?: string
  readonly validate?: EmailFieldValidation
} & Omit<FormFieldBase<EmailFieldClientWithoutType>, 'validate'>

export type EmailFieldLabelServerComponent = FieldLabelServerComponent<EmailField>

export type EmailFieldLabelClientComponent = FieldLabelClientComponent<EmailFieldClientWithoutType>

export type EmailFieldDescriptionServerComponent = FieldDescriptionServerComponent<EmailField>

export type EmailFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<EmailFieldClientWithoutType>

export type EmailFieldErrorServerComponent = FieldErrorServerComponent<EmailField>

export type EmailFieldErrorClientComponent = FieldErrorClientComponent<EmailFieldClientWithoutType>
