import type { CustomComponent, ServerProps } from '../../config/types.js'
import type { FormFieldBase } from './Field.js'

export type ErrorProps = {
  CustomError?: React.ReactNode
  alignCaret?: 'center' | 'left' | 'right'
  message?: string
  path?: string
  showError?: boolean
} & FormFieldBase &
  Partial<ServerProps>

export type ErrorComponent = CustomComponent<ErrorProps>
