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

export type FieldErrorProps<
  T extends MarkOptional<ClientField, 'type'> = MarkOptional<ClientField, 'type'>,
> = {
  field: T
} & GenericErrorProps &
  Partial<ServerProps>

export type ErrorComponent<
  T extends MarkOptional<ClientField, 'type'> = MarkOptional<ClientField, 'type'>,
> = React.ComponentType<FieldErrorProps<T>>
