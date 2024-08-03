import type { CustomComponent, ServerProps } from '../../config/types.js'
import type { FieldTypes } from '../../fields/config/types.js'
import type { FieldComponentProps } from '../fields/index.js'
import type { FormFieldBase } from './Field.js'

export type GenericLabelProps = {
  readonly as?: 'label' | 'span'
  readonly htmlFor?: string
  readonly schemaPath?: string
  readonly unstyled?: boolean
} & FormFieldBase

export type LabelProps<T extends 'hidden' | FieldTypes = any> = {
  type: T
} & FieldComponentProps &
  GenericLabelProps &
  Partial<ServerProps>

export type SanitizedLabelProps<T extends 'hidden' | FieldTypes = any> = Omit<
  LabelProps<T>,
  'label' | 'required'
>

export type LabelComponent<T extends 'hidden' | FieldTypes = any> = CustomComponent<LabelProps<T>>
