import type React from 'react'

import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { TextareaFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type TextareaFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'textarea' }>

export type TextareaFieldProps = {
  readonly field: TextareaFieldClient
  readonly inputRef?: React.MutableRefObject<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextareaFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type TextareaFieldLabelComponent = LabelComponent<'textarea'>

export type TextareaFieldDescriptionComponent = DescriptionComponent<'textarea'>

export type TextareaFieldErrorComponent = ErrorComponent<'textarea'>
