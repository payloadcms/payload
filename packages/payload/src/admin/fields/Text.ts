import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextField, TextFieldClient } from '../../fields/config/types.js'
import type { TextFieldValidation } from '../../fields/validations.js'
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
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type TextFieldClientWithoutType = MarkOptional<TextFieldClient, 'type'>

type TextFieldBaseClientProps = {
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly path: string
  readonly validate?: TextFieldValidation
}

type TextFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type TextFieldClientProps = ClientFieldBase<TextFieldClientWithoutType> &
  TextFieldBaseClientProps

export type TextFieldServerProps = ServerFieldBase<TextField, TextFieldClientWithoutType> &
  TextFieldBaseServerProps

export type TextFieldServerComponent = FieldServerComponent<
  TextField,
  TextFieldClientWithoutType,
  TextFieldBaseServerProps
>

export type TextFieldClientComponent = FieldClientComponent<
  TextFieldClientWithoutType,
  TextFieldBaseClientProps
>

export type TextFieldLabelServerComponent = FieldLabelServerComponent<
  TextField,
  TextFieldClientWithoutType
>

export type TextFieldLabelClientComponent = FieldLabelClientComponent<TextFieldClientWithoutType>

export type TextFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  TextField,
  TextFieldClientWithoutType
>

export type TextFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<TextFieldClientWithoutType>

export type TextFieldErrorServerComponent = FieldErrorServerComponent<
  TextField,
  TextFieldClientWithoutType
>

export type TextFieldErrorClientComponent = FieldErrorClientComponent<TextFieldClientWithoutType>
