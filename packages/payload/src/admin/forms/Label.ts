import type { CustomComponent, ServerProps } from '../../config/types.js'
import type { FormFieldBase } from './Field.js'
import type { FieldTypes } from './FieldTypes.js'

export type GenericLabelProps = {
  as?: 'label' | 'span'
  htmlFor?: string
  schemaPath?: string
  unstyled?: boolean
} & FormFieldBase

export type LabelProps<T extends keyof FieldTypes = any> = {
  label?: FormFieldBase['label']
  required?: boolean
} & {
  type: T
} & GenericLabelProps
export type SanitizedLabelProps<T extends keyof FieldTypes = any> = Omit<
  LabelProps<T>,
  'label' | 'required'
>

export type LabelComponent<T extends keyof FieldTypes = any> = CustomComponent<LabelProps<T>>
