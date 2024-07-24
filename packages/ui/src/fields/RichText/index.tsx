import type React from 'react'

import type { FormFieldBase } from '../shared/index.js'

export type RichTextFieldProps = {
  name: string
  richTextComponentMap?: Map<string, unknown>
  width?: string
} & FormFieldBase

export const RichTextField: React.FC<RichTextFieldProps> = () => {
  return null
}
