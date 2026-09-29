import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextField, TextFieldClient } from '../../fields/config/types.js'
import type { TextFieldValidation } from '../../fields/validations.js'
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
export type TextFieldLabelServerProps = FieldLabelServerProps<TextField, TextFieldClientWithoutType>

export type TextFieldLabelClientProps = FieldLabelClientProps<TextFieldClientWithoutType>

export type TextFieldDescriptionServerProps = FieldDescriptionServerProps<
  TextField,
  TextFieldClientWithoutType
>

export type TextFieldDescriptionClientProps =
  FieldDescriptionClientProps<TextFieldClientWithoutType>

export type TextFieldErrorServerProps = FieldErrorServerProps<TextField, TextFieldClientWithoutType>

export type TextFieldErrorClientProps = FieldErrorClientProps<TextFieldClientWithoutType>

export type TextFieldDiffServerProps = FieldDiffServerProps<TextField, TextFieldClient>

export type TextFieldDiffClientProps = FieldDiffClientProps<TextFieldClient>
