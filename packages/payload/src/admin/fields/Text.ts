import type { TextField } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

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
  type?: 'text'
  width?: string
} & FormFieldBase
