import type { MarkOptional } from 'ts-essentials'

import type { EmailField, EmailFieldClient } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldPaths,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldDiffClientComponent,
  FieldDiffServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type EmailFieldClientWithoutType = MarkOptional<EmailFieldClient, 'type'>

type EmailFieldBaseClientProps = {
  readonly path: string
  readonly validate?: EmailFieldValidation
}

type EmailFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type EmailFieldClientProps = ClientFieldBase<EmailFieldClientWithoutType> &
  EmailFieldBaseClientProps

export type EmailFieldServerProps = EmailFieldBaseServerProps &
  ServerFieldBase<EmailField, EmailFieldClientWithoutType>

export type EmailFieldServerComponent = FieldServerComponent<
  EmailField,
  EmailFieldClientWithoutType,
  EmailFieldBaseServerProps
>

export type EmailFieldClientComponent = FieldClientComponent<
  EmailFieldClientWithoutType,
  EmailFieldBaseClientProps
>

export type EmailFieldLabelServerComponent = FieldLabelServerComponent<
  EmailField,
  EmailFieldClientWithoutType
>

export type EmailFieldLabelClientComponent = FieldLabelClientComponent<EmailFieldClientWithoutType>

export type EmailFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  EmailField,
  EmailFieldClientWithoutType
>

export type EmailFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<EmailFieldClientWithoutType>

export type EmailFieldErrorServerComponent = FieldErrorServerComponent<
  EmailField,
  EmailFieldClientWithoutType
>

export type EmailFieldErrorClientComponent = FieldErrorClientComponent<EmailFieldClientWithoutType>

export type EmailFieldDiffServerComponent = FieldDiffServerComponent<EmailField, EmailFieldClient>

export type EmailFieldDiffClientComponent = FieldDiffClientComponent<EmailFieldClient>
