import type { FormFieldBase } from '../shared.js'

export type TextFieldProps = FormFieldBase & {
  hasMany?: boolean
  inputRef?: React.MutableRefObject<HTMLInputElement>
  maxRows?: number
  minRows?: number
  name?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  path?: string
}
