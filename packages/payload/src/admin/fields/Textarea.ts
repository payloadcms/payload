import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextareaFieldClient } from '../../fields/config/types.js'
import type { TextareaFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type TextareaFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<TextareaFieldProps>
  readonly errorProps?: ErrorProps<TextareaFieldProps>
  readonly field: MarkOptional<TextareaFieldClient, 'type'>
  readonly inputRef?: React.Ref<HTMLInputElement>
  readonly labelProps?: LabelProps<TextareaFieldProps>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextareaFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type TextareaFieldLabelComponent = LabelComponent<TextareaFieldProps>

export type TextareaFieldDescriptionComponent = DescriptionComponent<TextareaFieldProps>

export type TextareaFieldErrorComponent = ErrorComponent<TextareaFieldProps>
