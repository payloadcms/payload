import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { TextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type TextFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'text'>
  readonly inputRef?: React.MutableRefObject<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextFieldValidation
} & FormFieldBase

export type TextFieldLabelComponent = LabelComponent<'text'>

export type TextFieldDescriptionComponent = DescriptionComponent<'text'>

export type TextFieldErrorComponent = ErrorComponent<'text'>
