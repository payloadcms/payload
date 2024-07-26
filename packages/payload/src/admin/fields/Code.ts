import type { CodeField } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

export type CodeFieldProps = {
  editorOptions?: CodeField['admin']['editorOptions']
  language?: CodeField['admin']['language']
  name?: string
  path?: string
  width: string
} & FormFieldBase
