import type { ServerProps } from '../../config/types.js'
import type { ClientField, Field } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'
import type { ClientFieldWithOptionalType } from './Field.js'

export type GenericErrorProps = {
  readonly alignCaret?: 'center' | 'left' | 'right'
  readonly CustomError?: MappedComponent
  readonly message?: string
  readonly path?: string
  readonly showError?: boolean
}

export type FieldErrorClientProps<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  field: TFieldClient
} & GenericErrorProps

export type FieldErrorServerProps<TFieldServer extends Field> = {
  readonly createClientField?: (field: Field) => ClientField
  field: TFieldServer
} & GenericErrorProps &
  Partial<ServerProps>

export type FieldErrorClientComponent<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldErrorClientProps<TFieldClient>>

export type FieldErrorServerComponent<TFieldServer extends Field = Field> = React.ComponentType<
  FieldErrorServerProps<TFieldServer>
>
