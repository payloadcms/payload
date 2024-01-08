import type { TextField } from 'payload/types'

export type FormFieldBase = {
  path?: string
  value?: string
  valid?: boolean
  errorMessage?: string
}

export type Props = FormFieldBase &
  Omit<TextField, 'type'> & {
    inputRef?: React.MutableRefObject<HTMLInputElement>
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  }
