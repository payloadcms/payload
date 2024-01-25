import type { TextField } from 'payload/types'
import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<TextField, 'type'> & {
    inputRef?: React.MutableRefObject<HTMLInputElement>
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  }
