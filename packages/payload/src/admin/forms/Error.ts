import type { CustomComponent } from '../../config/types.js'

export type ErrorProps = {
  CustomError?: React.ReactNode
  alignCaret?: 'center' | 'left' | 'right'
  message?: string
  path?: string
  showError?: boolean
}

export type ErrorComponent = CustomComponent<ErrorProps>
