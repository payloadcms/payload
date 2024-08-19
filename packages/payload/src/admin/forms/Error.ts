import type { MarkOptional } from 'ts-essentials'

import type { ServerProps } from '../../config/types.js'
import type { ClientField, Field } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type GenericErrorProps = {
  readonly CustomError?: MappedComponent
  readonly alignCaret?: 'center' | 'left' | 'right'
  readonly message?: string
  readonly path?: string
  readonly showError?: boolean
}

export type FieldErrorClientProps<
  T extends MarkOptional<ClientField, 'type'> = MarkOptional<ClientField, 'type'>,
> = {
  field: T
} & GenericErrorProps

export type FieldErrorServerProps<T extends Field> = {
  field: T
} & GenericErrorProps &
  Partial<ServerProps>

export type FieldErrorClientComponent<
  T extends MarkOptional<ClientField, 'type'> = MarkOptional<ClientField, 'type'>,
> = React.ComponentType<FieldErrorClientProps<T>>

export type FieldErrorServerComponent<T extends Field = Field> = React.ComponentType<
  FieldErrorServerProps<T>
>
