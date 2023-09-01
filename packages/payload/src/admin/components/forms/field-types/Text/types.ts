import type { TextField } from '../../../../../fields/config/types'

export type Props = Omit<TextField, 'type'> & {
  inputRef?: React.MutableRefObject<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  path?: string
}
