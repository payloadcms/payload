import type { PasswordFieldValidation } from 'packages/payload/src/fields/validations.js'
import type {
  ErrorProps,
  FormFieldBase,
  GenericClientFieldConfig,
  LabelProps,
  MappedComponent,
  StaticDescription,
} from 'payload'
import type { ChangeEvent } from 'react'

export type PasswordFieldProps = {
  readonly autoComplete?: string
  readonly field: GenericClientFieldConfig<'text'>
  readonly inputRef?: React.RefObject<HTMLInputElement>
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
  readonly errorProps: ErrorProps
  readonly inputRef?: React.RefObject<HTMLInputElement>
  readonly label: string
  readonly labelProps: LabelProps
  readonly onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly path: string
  readonly placeholder?: string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly rtl?: boolean
  readonly showError?: boolean
  readonly style?: React.CSSProperties
  readonly value?: string
  readonly width?: string
}
