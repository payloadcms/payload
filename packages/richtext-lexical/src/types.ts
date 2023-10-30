import type { SerializedEditorState } from 'lexical'
import type { FieldPermissions } from 'payload/auth'
import type { FieldTypes } from 'payload/config'
import type { RichTextFieldProps } from 'payload/types'

import type { SanitizedEditorConfig } from './field/lexical/config/types'

export type FieldProps = RichTextFieldProps<SerializedEditorState, AdapterProps, AdapterProps> & {
  fieldTypes: FieldTypes
  indexPath: string
  path?: string
  permissions: FieldPermissions
}

export type AdapterProps = {
  editorConfig: SanitizedEditorConfig
}
