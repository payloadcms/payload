import type React from 'react'

import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { TextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type TextClientField = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'text' }>

export type TextFieldProps = {
  readonly field: TextClientField
  readonly inputRef?: React.MutableRefObject<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type TextFieldLabelComponent = LabelComponent<'text'>

export type TextFieldDescriptionComponent = DescriptionComponent<'text'>

export type TextFieldErrorComponent = ErrorComponent<'text'>
