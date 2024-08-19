import type {
  FieldBaseClient,
  FieldDescriptionProps,
  FieldErrorProps,
  FieldLabelProps,
  FormFieldBase,
  MappedComponent,
  PasswordFieldValidation,
  StaticDescription,
  TextFieldClient,
} from 'payload'
import type { ChangeEvent } from 'react'
import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

export type PasswordFieldProps = {
  readonly autoComplete?: string
  readonly descriptionProps?: FieldDescriptionProps<PasswordFieldProps>
  readonly errorProps?: FieldErrorProps<PasswordFieldProps>
  readonly field: MarkOptional<TextFieldClient, 'type'>
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly labelProps?: FieldLabelProps<PasswordFieldProps>
  readonly validate?: PasswordFieldValidation
} & FormFieldBase

export type PasswordInputProps = {
  readonly Description?: MappedComponent
  readonly Error?: MappedComponent
  readonly Label?: MappedComponent
  readonly afterInput?: MappedComponent[]
  readonly autoComplete?: string
  readonly beforeInput?: MappedComponent[]
  readonly className?: string
  readonly description?: StaticDescription
  readonly errorProps: FieldErrorProps<PasswordFieldProps>
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly label: FieldBaseClient['label']
  readonly labelProps: FieldLabelProps<PasswordFieldProps>
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
  readonly width?: string
}
