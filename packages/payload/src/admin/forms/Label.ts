import type { MarkOptional } from 'ts-essentials'

import type { ServerProps, StaticLabel } from '../../config/types.js'
import type { ClientField } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type GenericLabelProps = {
  readonly Label?: MappedComponent
  readonly as?: 'label' | 'span'
  readonly htmlFor?: string
  readonly label?: StaticLabel
  readonly required?: boolean
  readonly unstyled?: boolean
}

export type FieldLabelProps<
  T extends MarkOptional<ClientField, 'type'> = MarkOptional<ClientField, 'type'>,
> = {
  field: T
} & GenericLabelProps &
  Partial<ServerProps>

export type SanitizedLabelProps<T extends ClientField> = Omit<
  FieldLabelProps<T>,
  'label' | 'required'
>

export type LabelComponent<
  T extends MarkOptional<ClientField, 'type'> = MarkOptional<ClientField, 'type'>,
> = React.ComponentType<FieldLabelProps<T>>
