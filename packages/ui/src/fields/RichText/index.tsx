import type { MappedComponent } from 'payload'
import type React from 'react'

import type { FormFieldBase } from '../shared/index.js'

export type RichTextFieldProps = {
  name: string
  richTextComponentMap?: Map<string, MappedComponent | unknown>
  width?: string
} & FormFieldBase

export const RichTextField: React.FC<RichTextFieldProps> = () => {
  return null
}
