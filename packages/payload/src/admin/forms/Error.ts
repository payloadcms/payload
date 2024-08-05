import type { CustomComponent, ServerProps } from '../../config/types.js'
import type { FieldTypes } from '../../fields/config/types.js'
import type { FieldComponentProps, MappedComponent } from '../types.js'

export type GenericErrorProps = {
  CustomError?: MappedComponent
  alignCaret?: 'center' | 'left' | 'right'
  message?: string
  path?: string
  showError?: boolean
}

export type ErrorProps<T extends 'hidden' | FieldTypes = any> = {
  type: T
} & FieldComponentProps &
  GenericErrorProps &
  Partial<ServerProps>

export type ErrorComponent<T extends 'hidden' | FieldTypes = any> = CustomComponent<ErrorProps<T>>
