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

type ClientFieldWithoutType = MarkOptional<ClientField, 'type'>

export type LabelProps<T extends ClientFieldWithoutType = ClientFieldWithoutType> = {
  field: T
} & GenericLabelProps &
  Partial<ServerProps>

export type SanitizedLabelProps<T extends ClientField> = Omit<LabelProps<T>, 'label' | 'required'>

export type LabelComponent<T extends ClientFieldWithoutType = ClientFieldWithoutType> =
  React.ComponentType<LabelProps<T>>
