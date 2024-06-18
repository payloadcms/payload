import type { EditorConfig as LexicalEditorConfig, SerializedEditorState } from 'lexical'
import type {
  FieldPermissions,
  FieldTypes,
  RichTextAdapter,
  RichTextFieldProps,
  SanitizedConfig,
} from 'payload'
import type React from 'react'

import type { FeatureProviderServer } from './field/features/types.js'
import type { SanitizedServerEditorConfig } from './field/lexical/config/types.js'

export type LexicalFieldAdminProps = {
  /**
   * Controls if the gutter (padding to the left & gray vertical line) should be hidden. @default false
   */
  hideGutter?: boolean
}

export type LexicalEditorProps = {
  admin?: LexicalFieldAdminProps
  features?:
    | (({
        defaultFeatures,
        rootFeatures,
      }: {
        /**
         * This opinionated array contains all "recommended" default features.
         *
         * @Example
         *
         * ```ts
         *  editor: lexicalEditor({
         *    features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
         *  })
         *  ```
         */
        defaultFeatures: FeatureProviderServer<any, any>[]
        /**
         * This array contains all features that are enabled in the root richText editor (the one defined in the payload.config.ts).
         * If this field is the root richText editor, or if the root richText editor is not a lexical editor, this array will be empty
         *
         * @Example
         *
         * ```ts
         *  editor: lexicalEditor({
         *    features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature()],
         *  })
         *  ```
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
