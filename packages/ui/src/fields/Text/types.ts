import type { MappedComponent, StaticDescription, StaticLabel, TextFieldClient } from 'payload'
import type { ChangeEvent } from 'react'
import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

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
  readonly afterInput?: MappedComponent[]
  readonly beforeInput?: MappedComponent[]
  readonly className?: string
  readonly Description?: MappedComponent
  readonly description?: StaticDescription
  readonly descriptionProps?: Record<string, unknown>
  readonly Error?: MappedComponent
  readonly errorProps?: Record<string, unknown>
  readonly field?: MarkOptional<TextFieldClient, 'type'>
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly Label?: MappedComponent
  readonly label?: StaticLabel
  readonly labelProps?: Record<string, unknown>
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
  readonly width?: React.CSSProperties['width']
} & SharedTextFieldProps
