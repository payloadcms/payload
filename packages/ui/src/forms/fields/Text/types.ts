import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  inputRef?: React.MutableRefObject<HTMLInputElement>
  name?: string
  hasMany?: boolean
  maxRows?: number
  minRows?: number
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  path?: string
}
