import type { MappedField } from '../forms/FieldMap.js'
import type { FormFieldBase } from '../types.js'

export type RichTextComponentProps = {
  name: string
  richTextComponentMap?: Map<string, MappedField[] | React.ReactNode>
  type?: 'richText'
  width?: string
} & FormFieldBase
