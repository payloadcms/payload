import type { MarkOptional } from 'ts-essentials'

import type { EmailField, EmailFieldClient } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type EmailFieldClientWithoutType = MarkOptional<EmailFieldClient, 'type'>

type EmailFieldBaseClientProps = {
  readonly autoComplete?: string
  readonly validate?: EmailFieldValidation
}

export type EmailFieldClientProps = ClientFieldBase<EmailFieldClientWithoutType> &
  EmailFieldBaseClientProps

export type EmailFieldServerProps = ServerFieldBase<EmailField>

export type EmailFieldServerComponent = FieldServerComponent<EmailField, EmailFieldClient>

export type EmailFieldClientComponent = FieldClientComponent<
  EmailFieldClientWithoutType,
  EmailFieldBaseClientProps
>

export type EmailFieldLabelServerComponent = FieldLabelServerComponent<EmailField>

export type EmailFieldLabelClientComponent = FieldLabelClientComponent<EmailFieldClientWithoutType>

export type EmailFieldDescriptionServerComponent = FieldDescriptionServerComponent<EmailField>

export type EmailFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<EmailFieldClientWithoutType>

export type EmailFieldErrorServerComponent = FieldErrorServerComponent<EmailField>

export type EmailFieldErrorClientComponent = FieldErrorClientComponent<EmailFieldClientWithoutType>
