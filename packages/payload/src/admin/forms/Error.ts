import type { ServerProps } from '../../config/types.js'
import type { ClientFieldProps } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type GenericErrorProps = {
  readonly CustomError?: MappedComponent
  readonly alignCaret?: 'center' | 'left' | 'right'
  readonly message?: string
  readonly path?: string
  readonly showError?: boolean
}

export type ErrorProps<T extends ClientFieldProps> = {
  type: T
} & GenericErrorProps &
  Partial<ServerProps>

export type ErrorComponent<T extends ClientFieldProps> = React.ComponentType<ErrorProps<T>>
