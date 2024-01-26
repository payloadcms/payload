import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  name?: string
  path?: string
  hasMany?: boolean
  maxRows?: number
  minRows?: number
  inputRef?: React.MutableRefObject<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}
