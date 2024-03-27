import type { SerializedEditorState } from 'lexical'
import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor.js'
import type { FieldPermissions } from 'payload/auth'
import type { FieldTypes } from 'payload/config'
import type { RichTextAdapter, RichTextFieldProps } from 'payload/types'
import type React from 'react'

import type { FeatureProviderServer } from './field/features/types.js'
import type { SanitizedServerEditorConfig } from './field/lexical/config/types.js'

export type LexicalEditorProps = {
  features?:
    | (({
        defaultFeatures,
      }: {
        defaultFeatures: FeatureProviderServer<unknown, unknown>[]
      }) => FeatureProviderServer<unknown, unknown>[])
    | FeatureProviderServer<unknown, unknown>[]
  lexical?: LexicalEditorConfig
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type LexicalRichTextAdapter = RichTextAdapter<SerializedEditorState, AdapterProps, any> & {
  editorConfig: SanitizedServerEditorConfig
}

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
