import type {
  FieldBaseClient,
  PasswordFieldValidation,
  StaticDescription,
  TextFieldClient,
} from 'payload'
import type { ChangeEvent, CSSProperties } from 'react'
import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

export type PasswordFieldProps = {
  readonly autoComplete?: string
  readonly field: MarkOptional<TextFieldClient, 'type'>
  readonly indexPath: string
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly parentPath: string
  readonly parentSchemaPath: string
  readonly path: string
  readonly schemaPath: string
  readonly validate?: PasswordFieldValidation
}

export type PasswordInputProps = {
  readonly AfterInput?: React.ReactNode
  readonly autoComplete?: string
  readonly BeforeInput?: React.ReactNode
  readonly className?: string
  readonly description?: StaticDescription
  readonly Description?: React.ReactNode
  readonly Error?: React.ReactNode
  readonly field?: MarkOptional<TextFieldClient, 'type'>
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly Label?: React.ReactNode
  readonly label: FieldBaseClient['label']
  readonly localized?: boolean
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
