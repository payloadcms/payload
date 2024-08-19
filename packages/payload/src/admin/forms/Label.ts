import type { ServerProps, StaticLabel } from '../../config/types.js'
import type { ClientFieldProps } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type GenericLabelProps = {
  readonly Label?: MappedComponent
  readonly as?: 'label' | 'span'
  readonly htmlFor?: string
  readonly label?: StaticLabel
  readonly required?: boolean
  readonly unstyled?: boolean
}

export type LabelProps<T extends ClientFieldProps> = GenericLabelProps & Partial<ServerProps> & T

export type SanitizedLabelProps<T extends ClientFieldProps> = Omit<
  LabelProps<T>,
  'label' | 'required'
>

export type LabelComponent<T extends ClientFieldProps = ClientFieldProps> = React.ComponentType<
  LabelProps<T>
>
