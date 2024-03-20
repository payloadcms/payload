import type { MappedField } from '@payloadcms/ui'

import type { FormFieldBase } from '../shared.js'

export type RichTextFieldProps = FormFieldBase & {
  name: string
  richTextComponentMap?: Map<string, MappedField[] | React.ReactNode>
  width?: string
}
