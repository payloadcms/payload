import type { CustomComponent, ServerProps } from '../../config/types.js'
import type { FieldTypes } from '../../fields/config/types.js'
import type { FieldComponentProps, MappedComponent } from '../types.js'

export type GenericErrorProps = {
  readonly CustomError?: MappedComponent
  readonly alignCaret?: 'center' | 'left' | 'right'
  readonly message?: string
  readonly path?: string
  readonly showError?: boolean
}

export type ErrorProps<T extends 'hidden' | FieldTypes = any> = {
  type: T
} & FieldComponentProps &
  GenericErrorProps &
  Partial<ServerProps>

export type ErrorComponent<T extends 'hidden' | FieldTypes = any> = CustomComponent<ErrorProps<T>>
