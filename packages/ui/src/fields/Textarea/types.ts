import type { MappedComponent, StaticDescription, StaticLabel } from 'payload'
import type React from 'react'

import { type ChangeEvent } from 'react'

export type TextAreaInputProps = {
  readonly Description?: MappedComponent
  readonly Error?: MappedComponent
  readonly Label?: MappedComponent
  readonly afterInput?: MappedComponent[]
  readonly beforeInput?: MappedComponent[]
  readonly className?: string
  readonly description?: StaticDescription
  readonly descriptionProps?: Record<string, unknown>
  readonly errorProps?: Record<string, unknown>
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly label: StaticLabel
  readonly labelProps?: Record<string, unknown>
  readonly onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly path: string
  readonly placeholder?: string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly rows?: number
  readonly rtl?: boolean
  readonly showError?: boolean
  readonly style?: React.CSSProperties
  readonly value?: string
  readonly valueToRender?: string
  readonly width?: string
}
