import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextareaField, TextareaFieldClient } from '../../fields/config/types.js'
import type { TextareaFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type TextareaFieldClientWithoutType = MarkOptional<TextareaFieldClient, 'type'>

export type TextareaFieldProps = {
  readonly inputRef?: React.Ref<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextareaFieldValidation
} & Omit<FormFieldBase<TextareaFieldClientWithoutType>, 'validate'>

export type TextareaFieldLabelServerComponent = FieldLabelServerComponent<TextareaField>

export type TextareaFieldLabelClientComponent =
  FieldLabelClientComponent<TextareaFieldClientWithoutType>

export type TextareaFieldDescriptionServerComponent = FieldDescriptionServerComponent<TextareaField>

export type TextareaFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<TextareaFieldClientWithoutType>

export type TextareaFieldErrorServerComponent = FieldErrorServerComponent<TextareaField>

export type TextareaFieldErrorClientComponent =
  FieldErrorClientComponent<TextareaFieldClientWithoutType>
