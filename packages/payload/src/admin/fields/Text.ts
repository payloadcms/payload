import type { ErrorComponent } from '../forms/Error.js'
import type { FieldProps } from '../forms/Field.js'
import type { DescriptionComponent, LabelComponent } from '../types.js'

export type TextFieldProps = {
  readonly inputRef?: React.MutableRefObject<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
} & FieldProps<'text'>

export type TextFieldLabelComponent = LabelComponent<'text'>

export type TextFieldDescriptionComponent = DescriptionComponent<'text'>

export type TextFieldErrorComponent = ErrorComponent<'text'>
