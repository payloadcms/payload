import type { JSONField } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type JSONFieldProps = FormFieldBase & {
  editorOptions?: JSONField['admin']['editorOptions']
  name?: string
  path?: string
}
