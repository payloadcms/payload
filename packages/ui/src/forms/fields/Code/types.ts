import type { CodeField, FieldBase } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type CodeFieldProps = FormFieldBase & {
  editorOptions?: CodeField['admin']['editorOptions']
  label?: FieldBase['label']
  language?: CodeField['admin']['language']
  name?: string
  path?: string
  width: string
}
