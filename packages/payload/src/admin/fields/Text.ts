import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextFieldClient } from '../../fields/config/types.js'
import type { TextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type TextFieldClientWithoutType = MarkOptional<TextFieldClient, 'type'>

export type TextFieldProps = {
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextFieldValidation
} & Omit<FormFieldBase<TextFieldClientWithoutType>, 'validate'>

export type TextFieldLabelComponent = LabelComponent<TextFieldClientWithoutType>

export type TextFieldDescriptionComponent = DescriptionComponent<TextFieldClientWithoutType>

export type TextFieldErrorComponent = ErrorComponent<TextFieldClientWithoutType>
