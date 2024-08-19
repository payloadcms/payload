import type { MarkOptional } from 'ts-essentials'

import type { ServerProps } from '../../config/types.js'
import type { ClientField } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type GenericErrorProps = {
  readonly CustomError?: MappedComponent
  readonly alignCaret?: 'center' | 'left' | 'right'
  readonly message?: string
  readonly path?: string
  readonly showError?: boolean
}

type ClientFieldWithoutType = MarkOptional<ClientField, 'type'>

export type ErrorProps<T extends ClientFieldWithoutType = ClientFieldWithoutType> = {
  field: T
} & GenericErrorProps &
  Partial<ServerProps>

export type ErrorComponent<T extends ClientFieldWithoutType = ClientFieldWithoutType> =
  React.ComponentType<ErrorProps<T>>
