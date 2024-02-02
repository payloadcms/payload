import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  name?: string
  path?: string
  inputRef?: React.MutableRefObject<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}
