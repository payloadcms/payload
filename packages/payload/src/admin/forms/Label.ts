import type { ServerProps, StaticLabel } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { ClientFieldWithOptionalType } from './Field.js'

export type GenericLabelProps = {
  readonly as?: 'label' | 'span'
  readonly htmlFor?: string
  readonly label?: StaticLabel
  readonly required?: boolean
  readonly unstyled?: boolean
}

export type FieldLabelClientProps<
  TFieldClient extends Partial<ClientFieldWithOptionalType> = Partial<ClientFieldWithOptionalType>,
> = {
  field?: TFieldClient
} & GenericLabelProps

export type FieldLabelServerProps<
  TFieldServer extends Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  clientField: TFieldClient
  readonly field: TFieldServer
} & GenericLabelProps &
  Partial<ServerProps>

export type SanitizedLabelProps<TFieldClient extends ClientFieldWithOptionalType> = Omit<
  FieldLabelClientProps<TFieldClient>,
  'label' | 'required'
>

export type FieldLabelClientComponent<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldLabelClientProps<TFieldClient>>

export type FieldLabelServerComponent<
  TFieldServer extends Field = Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldLabelServerProps<TFieldServer, TFieldClient>>
