import type { CodeField } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CodeFieldProps = {
  editorOptions?: CodeField['admin']['editorOptions']
  language?: CodeField['admin']['language']
  name?: string
  path?: string
  width: string
} & FormFieldBase

export type CodeFieldLabelComponent = LabelComponent<'code'>

export type CodeFieldDescriptionComponent = DescriptionComponent<'code'>

export type CodeFieldErrorComponent = ErrorComponent<'code'>
