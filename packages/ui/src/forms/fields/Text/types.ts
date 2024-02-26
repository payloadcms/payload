import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  inputRef?: React.MutableRefObject<HTMLInputElement>
  name?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  path?: string
}
