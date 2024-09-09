import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextField, TextFieldClient } from '../../fields/config/types.js'
import type { TextFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type TextFieldClientWithoutType = MarkOptional<TextFieldClient, 'type'>

export type TextFieldProps = {
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextFieldValidation
} & Omit<FormFieldBase<TextFieldClientWithoutType>, 'validate'>

export type TextFieldLabelServerComponent = FieldLabelServerComponent<TextField>

export type TextFieldLabelClientComponent = FieldLabelClientComponent<TextFieldClientWithoutType>

export type TextFieldDescriptionServerComponent = FieldDescriptionServerComponent<TextField>

export type TextFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<TextFieldClientWithoutType>

export type TextFieldErrorServerComponent = FieldErrorServerComponent<TextField>

export type TextFieldErrorClientComponent = FieldErrorClientComponent<TextFieldClientWithoutType>
