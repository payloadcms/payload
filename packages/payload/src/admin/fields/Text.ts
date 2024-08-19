import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextFieldClient } from '../../fields/config/types.js'
import type { TextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type TextFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<TextFieldProps>
  readonly errorProps?: ErrorProps<TextFieldProps>
  readonly field: MarkOptional<TextFieldClient, 'type'>
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly labelProps?: LabelProps<TextFieldProps>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type TextFieldLabelComponent = LabelComponent<TextFieldProps>

export type TextFieldDescriptionComponent = DescriptionComponent<TextFieldProps>

export type TextFieldErrorComponent = ErrorComponent<TextFieldProps>
