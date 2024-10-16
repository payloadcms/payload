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

export type CodeFieldServerProps = ServerFieldBase<CodeField, CodeFieldClientWithoutType>

export type CodeFieldServerComponent = FieldServerComponent<CodeField, CodeFieldClientWithoutType>

export type CodeFieldClientComponent = FieldClientComponent<
  CodeFieldClientWithoutType,
  CodeFieldBaseClientProps
>

export type CodeFieldLabelServerComponent = FieldLabelServerComponent<
  CodeField,
  CodeFieldClientWithoutType
>

export type CodeFieldLabelClientComponent = FieldLabelClientComponent<CodeFieldClientWithoutType>

export type CodeFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  CodeField,
  CodeFieldClientWithoutType
>

export type CodeFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<CodeFieldClientWithoutType>

export type CodeFieldErrorServerComponent = FieldErrorServerComponent<
  CodeField,
  CodeFieldClientWithoutType
>

export type CodeFieldErrorClientComponent = FieldErrorClientComponent<CodeFieldClientWithoutType>
