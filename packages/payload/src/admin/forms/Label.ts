import type { CustomComponent, ServerProps } from '../../config/types.js'
import type { FieldComponentProps } from '../fields/index.js'
import type { FormFieldBase } from './Field.js'
import type { FieldTypes } from './FieldTypes.js'

export type GenericLabelProps = {
  as?: 'label' | 'span'
  htmlFor?: string
  schemaPath?: string
  unstyled?: boolean
} & FormFieldBase

export type LabelProps<T extends keyof FieldTypes = any> = {
  type: T
} & FieldComponentProps &
  GenericLabelProps &
  Partial<ServerProps>

export type SanitizedLabelProps<T extends keyof FieldTypes = any> = Omit<
  LabelProps<T>,
  'label' | 'required'
>

export type LabelComponent<T extends keyof FieldTypes = any> = CustomComponent<LabelProps<T>>
