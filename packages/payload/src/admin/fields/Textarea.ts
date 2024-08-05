import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { TextareaFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type TextareaFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'textarea'>
  readonly inputRef?: React.MutableRefObject<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly validate?: TextareaFieldValidation
} & FormFieldBase

export type TextareaFieldLabelComponent = LabelComponent<'textarea'>

export type TextareaFieldDescriptionComponent = DescriptionComponent<'textarea'>

export type TextareaFieldErrorComponent = ErrorComponent<'textarea'>
