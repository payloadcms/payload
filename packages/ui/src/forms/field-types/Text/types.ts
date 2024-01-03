import type { TextField } from 'payload/types'

export type Props = Omit<TextField, 'type'> & {
  inputRef?: React.MutableRefObject<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  path?: string
  value?: string
}
