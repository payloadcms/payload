import type { StaticLabel } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { ClientFieldWithOptionalType, ServerComponentProps } from './Field.js'

export type GenericLabelProps = {
  readonly as?: 'h3' | 'label' | 'span'
  readonly hideLocale?: boolean
  readonly htmlFor?: string
  readonly label?: StaticLabel
  readonly localized?: boolean
  readonly path?: string
  readonly required?: boolean
  readonly unstyled?: boolean
}

export type FieldLabelClientProps<
  TFieldClient extends Partial<ClientFieldWithOptionalType> = Partial<ClientFieldWithOptionalType>,
> = GenericLabelProps & {
  field?: TFieldClient
}

export type FieldLabelServerProps<
  TFieldServer extends Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = GenericLabelProps &
  ServerComponentProps & {
    clientField: TFieldClient
    readonly field: TFieldServer
  }

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
