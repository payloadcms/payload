import type {
  FieldDescriptionClientProps,
  FieldErrorClientProps,
  FieldLabelClientProps,
  MappedComponent,
  StaticDescription,
  StaticLabel,
  TextareaFieldClient,
} from 'payload'
import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import { type ChangeEvent } from 'react'

export type TextAreaInputProps = {
  readonly afterInput?: MappedComponent[]
  readonly beforeInput?: MappedComponent[]
  readonly className?: string
  readonly Description?: MappedComponent
  readonly description?: StaticDescription
  readonly descriptionProps?: FieldDescriptionClientProps<MarkOptional<TextareaFieldClient, 'type'>>
  readonly Error?: MappedComponent
  readonly errorProps?: FieldErrorClientProps<MarkOptional<TextareaFieldClient, 'type'>>
  readonly field?: MarkOptional<TextareaFieldClient, 'type'>
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly Label?: MappedComponent
  readonly label?: StaticLabel
  readonly labelProps?: FieldLabelClientProps<MarkOptional<TextareaFieldClient, 'type'>>
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
  readonly width?: React.CSSProperties['width']
}
