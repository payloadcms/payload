import type { MappedComponent } from '../types.js'

export type ErrorProps = {
  CustomError?: MappedComponent
  alignCaret?: 'center' | 'left' | 'right'
  message?: string
  path?: string
  showError?: boolean
}
