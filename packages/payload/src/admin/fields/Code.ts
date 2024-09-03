import type { MarkOptional } from 'ts-essentials'

import type { CodeField, CodeFieldClient } from '../../fields/config/types.js'
import type { CodeFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type CodeFieldClientWithoutType = MarkOptional<CodeFieldClient, 'type'>

export type CodeFieldProps = {
  readonly autoComplete?: string
  readonly validate?: CodeFieldValidation
} & Omit<FormFieldBase<CodeFieldClientWithoutType>, 'validate'>

export type CodeFieldLabelServerComponent = FieldLabelServerComponent<CodeField>

export type CodeFieldLabelClientComponent = FieldLabelClientComponent<CodeFieldClientWithoutType>

export type CodeFieldDescriptionServerComponent = FieldDescriptionServerComponent<CodeField>

export type CodeFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<CodeFieldClientWithoutType>

export type CodeFieldErrorServerComponent = FieldErrorServerComponent<CodeField>

export type CodeFieldErrorClientComponent = FieldErrorClientComponent<CodeFieldClientWithoutType>
