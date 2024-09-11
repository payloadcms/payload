import type { MarkOptional } from 'ts-essentials'

import type { CodeField, CodeFieldClient } from '../../fields/config/types.js'
import type { CodeFieldValidation } from '../../fields/validations.js'
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

type CodeFieldClientWithoutType = MarkOptional<CodeFieldClient, 'type'>

type CodeFieldBaseClientProps = {
  readonly autoComplete?: string
  readonly valiCode?: CodeFieldValidation
}

export type CodeFieldClientProps = ClientFieldBase<CodeFieldClientWithoutType> &
  CodeFieldBaseClientProps

export type CodeFieldServerProps = ServerFieldBase<CodeField>

export type CodeFieldServerComponent = FieldServerComponent<CodeField, CodeFieldClient>

export type CodeFieldClientComponent = FieldClientComponent<
  CodeFieldClientWithoutType,
  CodeFieldBaseClientProps
>

export type CodeFieldLabelServerComponent = FieldLabelServerComponent<CodeField>

export type CodeFieldLabelClientComponent = FieldLabelClientComponent<CodeFieldClientWithoutType>

export type CodeFieldDescriptionServerComponent = FieldDescriptionServerComponent<CodeField>

export type CodeFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<CodeFieldClientWithoutType>

export type CodeFieldErrorServerComponent = FieldErrorServerComponent<CodeField>

export type CodeFieldErrorClientComponent = FieldErrorClientComponent<CodeFieldClientWithoutType>
