import type { CustomComponent, ServerProps } from '../../config/types.js'
import type { FieldComponentProps } from '../fields/index.js'
import type { FieldTypes } from './FieldTypes.js'

export type LabelProps<T extends keyof FieldTypes = any> = {
  as?: 'label' | 'span'
  htmlFor?: string
  schemaPath?: string
  type?: T
  unstyled?: boolean
} & FieldComponentProps &
  Partial<ServerProps>

export type SanitizedLabelProps<T extends keyof FieldTypes = any> = Omit<
  LabelProps<T>,
  'label' | 'required'
>

export type LabelComponent<T extends keyof FieldTypes = any> = CustomComponent<LabelProps<T>>
