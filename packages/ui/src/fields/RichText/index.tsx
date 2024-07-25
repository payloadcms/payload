import type { FormFieldBase } from 'payload'
import type React from 'react'

import type { MappedField } from '../../providers/ComponentMap/buildComponentMap/types.js'

export type RichTextFieldProps = {
  name: string
  richTextComponentMap?: Map<string, MappedField[] | React.ReactNode>
  width?: string
} & FormFieldBase

export const RichTextField: React.FC<RichTextFieldProps> = () => {
  return null
}
