import type React from 'react'

import type { MappedField } from '../../utilities/buildComponentMap/types.js'
import type { FormFieldBase } from '../shared.js'

export type RichTextFieldProps = FormFieldBase & {
  richTextComponentMap?: Map<string, MappedField[] | React.ReactNode>
}

export const RichText: React.FC<RichTextFieldProps> = () => {
  return null
}
