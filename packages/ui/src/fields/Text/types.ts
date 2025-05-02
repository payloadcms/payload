import type { StaticDescription, StaticLabel } from 'payload'
import type { ChangeEvent } from 'react'
import type React from 'react'

import type { Option, ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'

export type SharedTextFieldProps =
  | {
      readonly hasMany?: false
      readonly onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    }
  | {
      readonly hasMany?: true
      readonly onChange?: ReactSelectAdapterProps['onChange']
    }

export type TextInputProps = {
  readonly AfterInput?: React.ReactNode
  readonly BeforeInput?: React.ReactNode
  readonly className?: string
  readonly Description?: React.ReactNode
  readonly description?: StaticDescription
  readonly Error?: React.ReactNode
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly Label?: React.ReactNode
  readonly label?: StaticLabel
  readonly localized?: boolean
  readonly maxRows?: number
  readonly minRows?: number
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly path: string
  readonly placeholder?: Record<string, string> | string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly rtl?: boolean
  readonly showError?: boolean
  readonly style?: React.CSSProperties
  readonly value?: string
  readonly valueToRender?: Option[]
} & SharedTextFieldProps
