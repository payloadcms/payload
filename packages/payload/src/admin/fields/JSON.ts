import type { JSONField } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type JSONFieldProps = {
  editorOptions?: JSONField['admin']['editorOptions']
  jsonSchema?: Record<string, unknown>
  name?: string
  path?: string
  width?: string
} & FormFieldBase

export type JSONFieldLabelComponent = LabelComponent<'json'>

export type JSONFieldDescriptionComponent = DescriptionComponent<'json'>

export type JSONFieldErrorComponent = ErrorComponent<'json'>
