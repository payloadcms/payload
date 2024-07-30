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

export type ErrorProps<T extends FieldTypes = any> = {
  type: T
} & FieldComponentProps &
  GenericErrorProps &
  Partial<ServerProps>

export type ErrorComponent<T extends FieldTypes = any> = CustomComponent<ErrorProps<T>>
