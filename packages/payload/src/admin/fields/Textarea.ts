import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextareaFieldClient } from '../../fields/config/types.js'
import type { TextareaFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type TextareaFieldClientWithoutType = MarkOptional<TextareaFieldClient, 'type'>

export type TextareaFieldProps = {
  readonly inputRef?: React.Ref<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextareaFieldValidation
} & Omit<FormFieldBase<TextareaFieldClientWithoutType>, 'validate'>

export type TextareaFieldLabelComponent = LabelComponent<TextareaFieldClientWithoutType>

export type TextareaFieldDescriptionComponent = DescriptionComponent<TextareaFieldClientWithoutType>

export type TextareaFieldErrorComponent = ErrorComponent<TextareaFieldClientWithoutType>
