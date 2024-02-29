import type { SerializedEditorState } from 'lexical'
import type { FieldPermissions } from 'payload/auth'
import type { FieldTypes } from 'payload/config'
import type { RichTextFieldProps } from 'payload/types'
import type React from 'react'

import type { SanitizedServerEditorConfig } from './field/lexical/config/types'

export type FieldProps = RichTextFieldProps<SerializedEditorState, AdapterProps, AdapterProps> & {
  fieldTypes: FieldTypes
  indexPath: string
  path?: string
  permissions: FieldPermissions
}

export type AdapterProps = {
  editorConfig: SanitizedServerEditorConfig
}

export type GeneratedFeatureProviderComponent = {
  ClientComponent: React.ReactNode
  key: string
  order: number
}
