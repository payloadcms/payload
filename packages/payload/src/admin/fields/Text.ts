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

type TextFieldClientWithoutType = MarkOptional<TextFieldClient, 'type'>

export type TextFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<TextFieldClientWithoutType>
  readonly errorProps?: ErrorProps<TextFieldClientWithoutType>
  readonly field: TextFieldClientWithoutType
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly labelProps?: LabelProps<TextFieldClientWithoutType>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type TextFieldLabelComponent = LabelComponent<TextFieldClientWithoutType>

export type TextFieldDescriptionComponent = DescriptionComponent<TextFieldClientWithoutType>

export type TextFieldErrorComponent = ErrorComponent<TextFieldClientWithoutType>
