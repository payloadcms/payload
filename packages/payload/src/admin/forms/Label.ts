import type { MarkOptional } from 'ts-essentials'

import type { ServerProps, StaticLabel } from '../../config/types.js'
import type { ClientField, Field } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type GenericLabelProps = {
  readonly Label?: MappedComponent
  readonly as?: 'label' | 'span'
  readonly htmlFor?: string
  readonly label?: StaticLabel
  readonly required?: boolean
  readonly unstyled?: boolean
}

type ClientFieldWithOptionalType = MarkOptional<ClientField, 'type'>

export type FieldLabelClientProps<
  T extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  field: T
} & GenericLabelProps

export type FieldLabelServerProps<T extends Field> = {
  field: T
} & GenericLabelProps &
  Partial<ServerProps>

export type SanitizedLabelProps<T extends ClientField> = Omit<
  FieldLabelClientProps<T>,
  'label' | 'required'
>

export type FieldLabelClientComponent<
  T extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldLabelClientProps<T>>

export type FieldLabelServerComponent<T extends Field = Field> = React.ComponentType<
  FieldLabelServerProps<T>
>
