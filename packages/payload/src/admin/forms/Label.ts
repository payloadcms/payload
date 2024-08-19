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

export type FieldLabelClientProps<
  T extends MarkOptional<ClientField, 'type'> = MarkOptional<ClientField, 'type'>,
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
  T extends MarkOptional<ClientField, 'type'> = MarkOptional<ClientField, 'type'>,
> = React.ComponentType<FieldLabelClientProps<T>>

export type FieldLabelServerComponent<T extends Field = Field> = React.ComponentType<
  FieldLabelServerProps<T>
>
