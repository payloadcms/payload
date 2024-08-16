import type { CustomComponent, ServerProps, StaticLabel } from '../../config/types.js'
import type { FieldTypes } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type GenericLabelProps = {
  readonly Label?: MappedComponent
  readonly as?: 'label' | 'span'
  readonly htmlFor?: string
  readonly label?: StaticLabel
  readonly required?: boolean
  readonly unstyled?: boolean
}

export type LabelProps<T extends 'hidden' | FieldTypes = any> = {
  type: T
} & GenericLabelProps &
  Partial<ServerProps>

export type SanitizedLabelProps<T extends 'hidden' | FieldTypes = any> = Omit<
  LabelProps<T>,
  'label' | 'required'
>

export type LabelComponent<T extends 'hidden' | FieldTypes = any> = CustomComponent<LabelProps<T>>
