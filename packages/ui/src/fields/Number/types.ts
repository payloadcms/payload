import type { StaticDescription, StaticLabel } from 'payload'
import type React from 'react'

import type { Option, ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'

export type SharedNumberFieldProps =
  | {
      readonly hasMany?: false
      readonly onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    }
  | {
      readonly hasMany?: true
      readonly onChange?: ReactSelectAdapterProps['onChange']
    }

export type NumberInputProps = {
  readonly AfterInput?: React.ReactNode
  readonly BeforeInput?: React.ReactNode
  readonly className?: string
  readonly Description?: React.ReactNode
  readonly description?: StaticDescription
  readonly Error?: React.ReactNode
  readonly Label?: React.ReactNode
  readonly label?: StaticLabel
  readonly localized?: boolean
  readonly max?: number
  readonly maxRows?: number
  readonly min?: number
  readonly onStep?: (direction: 'down' | 'up') => void
  readonly path: string
  readonly placeholder?: Record<string, string> | string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly showError?: boolean
  readonly step?: number
  readonly style?: React.CSSProperties
  readonly value?: null | number
  readonly valueToRender?: Option[]
} & SharedNumberFieldProps
