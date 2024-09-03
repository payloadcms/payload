import type { MarkOptional } from 'ts-essentials'

import type { ServerProps, StaticLabel } from '../../config/types.js'
import type { ClientField, Field } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type GenericLabelProps = {
  readonly as?: 'label' | 'span'
  readonly htmlFor?: string
  readonly Label?: MappedComponent
  readonly label?: StaticLabel
  readonly required?: boolean
  readonly unstyled?: boolean
}

type ClientFieldWithOptionalType = MarkOptional<ClientField, 'type'>

export type FieldLabelClientProps<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  field: TFieldClient
} & GenericLabelProps

export type FieldLabelServerProps<TFieldServer extends Field> = {
  field: TFieldServer
} & GenericLabelProps &
  Partial<ServerProps>

export type SanitizedLabelProps<TFieldClient extends ClientField> = Omit<
  FieldLabelClientProps<TFieldClient>,
  'label' | 'required'
>

export type FieldLabelClientComponent<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldLabelClientProps<TFieldClient>>

export type FieldLabelServerComponent<TFieldServer extends Field = Field> = React.ComponentType<
  FieldLabelServerProps<TFieldServer>
>
