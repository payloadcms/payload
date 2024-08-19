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

type TextareaFieldClientWithoutType = MarkOptional<TextareaFieldClient, 'type'>

export type TextareaFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<TextareaFieldClientWithoutType>
  readonly errorProps?: ErrorProps<TextareaFieldClientWithoutType>
  readonly field: TextareaFieldClientWithoutType
  readonly inputRef?: React.Ref<HTMLInputElement>
  readonly labelProps?: LabelProps<TextareaFieldClientWithoutType>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextareaFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type TextareaFieldLabelComponent = LabelComponent<TextareaFieldClientWithoutType>

export type TextareaFieldDescriptionComponent = DescriptionComponent<TextareaFieldClientWithoutType>

export type TextareaFieldErrorComponent = ErrorComponent<TextareaFieldClientWithoutType>
