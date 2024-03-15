import type { CodeField } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type CodeFieldProps = FormFieldBase & {
  editorOptions?: CodeField['admin']['editorOptions']
  language?: CodeField['admin']['language']
  name?: string
  path?: string
}
