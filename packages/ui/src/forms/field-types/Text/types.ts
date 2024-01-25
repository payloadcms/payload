import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  inputRef?: React.MutableRefObject<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}
