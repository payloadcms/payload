import type { FieldBase, TextField } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type TextFieldProps = FormFieldBase & {
  hasMany?: boolean
  inputRef?: React.MutableRefObject<HTMLInputElement>
  label?: FieldBase['label']
  maxLength?: number
  maxRows?: number
  minLength?: number
  minRows?: number
  name?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  path?: string
  placeholder?: TextField['admin']['placeholder']
  width?: string
}
