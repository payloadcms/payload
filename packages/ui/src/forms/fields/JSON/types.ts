import type { FieldBase, JSONField } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type JSONFieldProps = FormFieldBase & {
  editorOptions?: JSONField['admin']['editorOptions']
  label?: FieldBase['label']
  name?: string
  path?: string
  width?: string
}
