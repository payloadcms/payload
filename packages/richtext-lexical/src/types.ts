import type { RichTextFieldProps } from 'payload/types'

import type { SanitizedEditorConfig } from './field/lexical/config/types'

export type FieldProps = RichTextFieldProps<AdapterProps>

export type AdapterProps = {
  editorConfig: SanitizedEditorConfig
}
