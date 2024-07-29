import type { TextFieldProps } from 'payload'
import type { ChangeEvent } from 'react'

import type { Option, ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'

export type SharedTextFieldProps =
  | {
      hasMany?: false
      onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    }
  | {
      hasMany?: true
      onChange?: ReactSelectAdapterProps['onChange']
    }

export type TextInputProps = {
  inputRef?: React.MutableRefObject<HTMLInputElement>
  maxRows?: number
  minRows?: number
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  showError?: boolean
  value?: string
  valueToRender?: Option[]
} & Omit<TextFieldProps, 'type'> &
  SharedTextFieldProps
