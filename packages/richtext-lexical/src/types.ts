import type { EditorConfig as LexicalEditorConfig, SerializedEditorState } from 'lexical'
import type { FieldPermissions } from 'payload/auth'
import type { FieldTypes, SanitizedConfig } from 'payload/config'
import type { RichTextAdapter, RichTextFieldProps } from 'payload/types'
import type React from 'react'

import type { FeatureProviderServer } from './field/features/types.js'
import type { SanitizedServerEditorConfig } from './field/lexical/config/types.js'

export type LexicalEditorProps = {
  features?:
    | (({
        defaultFeatures,
        rootFeatures,
      }: {
        defaultFeatures: FeatureProviderServer<any, any>[]
        /**
         * The features that are enabled in the root richText editor (the one defined in the payload.config.ts).
         * If this is the root richText editor, or if the root richText editor is not a lexical editor, this will be an empty array.
         */
        rootFeatures: FeatureProviderServer<any, any>[]
      }) => FeatureProviderServer<any, any>[])
    | FeatureProviderServer<any, any>[]
  lexical?: LexicalEditorConfig
}

export type LexicalRichTextAdapter = RichTextAdapter<SerializedEditorState, AdapterProps, any> & {
  editorConfig: SanitizedServerEditorConfig
  features: FeatureProviderServer<any, any>[]
}

export type LexicalRichTextAdapterProvider =
  /**
   * This is being called during the payload sanitization process
   */
  ({
    config,
    isRoot,
  }: {
    config: SanitizedConfig
    isRoot?: boolean
  }) => Promise<LexicalRichTextAdapter>

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
