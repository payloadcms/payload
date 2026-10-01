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
  /** Overrides the input's `aria-label`. Defaults to the resolved label or path. */
  readonly ariaLabel?: string
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
  /** Short text affix rendered before the value, e.g. `W`, `H`, `X`. */
  readonly prefix?: string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly showError?: boolean
  /**
   * Controls the height of the input. Defaults to `'large'`.
   */
  readonly size?: 'large' | 'medium'
  readonly step?: number
  readonly style?: React.CSSProperties
  /** Short text affix rendered after the value, e.g. `%`. */
  readonly suffix?: string
  readonly value?: null | number
  readonly valueToRender?: Option[]
} & SharedNumberFieldProps
