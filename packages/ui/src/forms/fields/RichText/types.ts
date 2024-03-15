import type { MappedField } from '@payloadcms/ui'

import type { FormFieldBase } from '../shared.js'

export type RichTextFieldProps = FormFieldBase & {
  richTextComponentMap?: Map<string, MappedField[] | React.ReactNode>
}
