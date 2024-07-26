import type { JSONField } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

export type JSONFieldProps = {
  editorOptions?: JSONField['admin']['editorOptions']
  jsonSchema?: Record<string, unknown>
  name?: string
  path?: string
  type?: 'json'
  width?: string
} & FormFieldBase
