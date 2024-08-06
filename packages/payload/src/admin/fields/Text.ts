import type { TextField } from '../../fields/config/types.js'
import type { TextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type TextFieldProps = {
  hasMany?: boolean
  inputRef?: React.MutableRefObject<HTMLInputElement>
  maxLength?: number
  maxRows?: number
  minLength?: number
  minRows?: number
  name?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  path?: string
  placeholder?: TextField['admin']['placeholder']
  validate?: TextFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type TextFieldLabelComponent = LabelComponent<'text'>

export type TextFieldDescriptionComponent = DescriptionComponent<'text'>

export type TextFieldErrorComponent = ErrorComponent<'text'>
