import type {
  FieldBaseClient,
  FieldDescriptionClientProps,
  FieldErrorClientProps,
  FieldLabelClientProps,
  FormFieldBase,
  MappedComponent,
  PasswordFieldValidation,
  StaticDescription,
  TextFieldClient,
} from 'payload'
import type { ChangeEvent, CSSProperties } from 'react'
import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

export type PasswordFieldProps = {
  readonly autoComplete?: string
  readonly descriptionProps?: FieldDescriptionClientProps<MarkOptional<TextFieldClient, 'type'>>
  readonly errorProps?: FieldErrorClientProps<MarkOptional<TextFieldClient, 'type'>>
  readonly field: MarkOptional<TextFieldClient, 'type'>
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly labelProps?: FieldLabelClientProps<MarkOptional<TextFieldClient, 'type'>>
  readonly validate?: PasswordFieldValidation
} & FormFieldBase

export type PasswordInputProps = {
  readonly afterInput?: MappedComponent[]
  readonly autoComplete?: string
  readonly beforeInput?: MappedComponent[]
  readonly className?: string
  readonly Description?: MappedComponent
  readonly description?: StaticDescription
  readonly Error?: MappedComponent
  readonly errorProps: FieldErrorClientProps<MarkOptional<TextFieldClient, 'type'>>
  readonly field?: MarkOptional<TextFieldClient, 'type'>
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly Label?: MappedComponent
  readonly label: FieldBaseClient['label']
  readonly labelProps: FieldLabelClientProps<MarkOptional<TextFieldClient, 'type'>>
  readonly onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly path: string
  readonly placeholder?: Record<string, string> | string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly rtl?: boolean
  readonly showError?: boolean
  readonly style?: React.CSSProperties
  readonly value?: string
  readonly width?: CSSProperties['width']
}
