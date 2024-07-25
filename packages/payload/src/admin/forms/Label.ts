import type { CustomComponent, ServerProps } from '../../config/types.js'
import type { FormFieldBase } from './Field.js'

export type LabelProps = {
  as?: 'label' | 'span'
  htmlFor?: string
  schemaPath?: string
  unstyled?: boolean
} & FormFieldBase &
  Partial<ServerProps>

export type SanitizedLabelProps = Omit<LabelProps, 'label' | 'required'>

export type LabelComponent = CustomComponent<LabelProps>
