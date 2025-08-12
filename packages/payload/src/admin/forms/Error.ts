import type { Field } from '../../fields/config/types.js'
import type { ClientFieldWithOptionalType, ServerComponentProps } from './Field.js'

export type GenericErrorProps = {
  readonly alignCaret?: 'center' | 'left' | 'right'
  readonly message?: string
  readonly path?: string
  readonly showError?: boolean
}

export type FieldErrorClientProps<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  field: TFieldClient
} & GenericErrorProps

export type FieldErrorServerProps<
  TFieldServer extends Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  clientField: TFieldClient
  readonly field: TFieldServer
} & GenericErrorProps &
  ServerComponentProps

export type FieldErrorClientComponent<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldErrorClientProps<TFieldClient>>

export type FieldErrorServerComponent<
  TFieldServer extends Field = Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldErrorServerProps<TFieldServer, TFieldClient>>
