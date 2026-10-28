import type { MarkOptional } from 'ts-essentials'

import type { EmailField, EmailFieldClient } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientProps, FieldErrorServerProps } from '../forms/Error.js'
import type { ClientFieldBase, FieldPaths, ServerFieldBase } from '../forms/Field.js'
import type {
  FieldDescriptionClientProps,
  FieldDescriptionServerProps,
  FieldDiffClientProps,
  FieldDiffServerProps,
  FieldLabelClientProps,
  FieldLabelServerProps,
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
export type EmailFieldLabelServerProps = FieldLabelServerProps<
  EmailField,
  EmailFieldClientWithoutType
>

export type EmailFieldLabelClientProps = FieldLabelClientProps<EmailFieldClientWithoutType>

export type EmailFieldDescriptionServerProps = FieldDescriptionServerProps<
  EmailField,
  EmailFieldClientWithoutType
>

export type EmailFieldDescriptionClientProps =
  FieldDescriptionClientProps<EmailFieldClientWithoutType>

export type EmailFieldErrorServerProps = FieldErrorServerProps<
  EmailField,
  EmailFieldClientWithoutType
>

export type EmailFieldErrorClientProps = FieldErrorClientProps<EmailFieldClientWithoutType>

export type EmailFieldDiffServerProps = FieldDiffServerProps<EmailField, EmailFieldClient>

export type EmailFieldDiffClientProps = FieldDiffClientProps<EmailFieldClient>
