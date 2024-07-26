import type { CustomComponent, ServerProps } from '../../config/types.js'
import type { FieldComponentProps } from '../types.js'
import type { FieldTypes } from './FieldTypes.js'

export type GenericErrorProps = {
  CustomError?: React.ReactNode
  alignCaret?: 'center' | 'left' | 'right'
  message?: string
  path?: string
  showError?: boolean
}

export type ErrorProps<T extends keyof FieldTypes = any> = {
  type: T
} & FieldComponentProps &
  GenericErrorProps &
  Partial<ServerProps>

export type ErrorComponent<T extends keyof FieldTypes = any> = CustomComponent<ErrorProps<T>>
