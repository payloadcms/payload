import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextareaField, TextareaFieldClient } from '../../fields/config/types.js'
import type { TextareaFieldValidation } from '../../fields/validations.js'
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

type TextareaFieldClientWithoutType = MarkOptional<TextareaFieldClient, 'type'>

type TextareaFieldBaseClientProps = {
  readonly inputRef?: React.Ref<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly path: string
  readonly validate?: TextareaFieldValidation
}

type TextareaFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type TextareaFieldClientProps = ClientFieldBase<TextareaFieldClientWithoutType> &
  TextareaFieldBaseClientProps

export type TextareaFieldServerProps = ServerFieldBase<
  TextareaField,
  TextareaFieldClientWithoutType
> &
  TextareaFieldBaseServerProps

export type TextareaFieldServerComponent = FieldServerComponent<
  TextareaField,
  TextareaFieldClientWithoutType,
  TextareaFieldBaseServerProps
>

export type TextareaFieldClientComponent = FieldClientComponent<
  TextareaFieldClientWithoutType,
  TextareaFieldBaseClientProps
>

export type TextareaFieldLabelServerComponent = FieldLabelServerComponent<
  TextareaField,
  TextareaFieldClientWithoutType
>

export type TextareaFieldLabelClientComponent =
  FieldLabelClientComponent<TextareaFieldClientWithoutType>

export type TextareaFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  TextareaField,
  TextareaFieldClientWithoutType
>

export type TextareaFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<TextareaFieldClientWithoutType>

export type TextareaFieldErrorServerComponent = FieldErrorServerComponent<
  TextareaField,
  TextareaFieldClientWithoutType
>

export type TextareaFieldErrorClientComponent =
  FieldErrorClientComponent<TextareaFieldClientWithoutType>

export type TextareaFieldDiffServerComponent = FieldDiffServerComponent<
  TextareaField,
  TextareaFieldClient
>

export type TextareaFieldDiffClientComponent = FieldDiffClientComponent<TextareaFieldClient>
