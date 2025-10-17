import type { EditorConfig as LexicalEditorConfig, SerializedEditorState } from 'lexical'
import type {
  ClientField,
  DefaultServerCellComponentProps,
  LabelFunction,
  PayloadComponent,
  RichTextAdapter,
  RichTextField,
  RichTextFieldClient,
  RichTextFieldClientProps,
  SanitizedConfig,
  ServerFieldBase,
  StaticLabel,
} from 'payload'
import type { JSX } from 'react'

import type {
  BaseClientFeatureProps,
  FeatureProviderProviderClient,
} from './features/typesClient.js'
import type { FeatureProviderServer } from './features/typesServer.js'
import type { SanitizedServerEditorConfig } from './lexical/config/types.js'
import type { InitialLexicalFormState } from './utilities/buildInitialState.js'

export type LexicalFieldAdminProps = {
  /**
   * Controls if the add block button should be hidden. @default false
   */
  hideAddBlockButton?: boolean
  /**
   * Controls if the draggable block element should be hidden. @default false
   */
  hideDraggableBlockElement?: boolean
  /**
   * Controls if the gutter (padding to the left & gray vertical line) should be hidden. @default false
   */
  hideGutter?: boolean
  /**
   * Controls if the insert paragraph at the end button should be hidden. @default false
   */
  hideInsertParagraphAtEnd?: boolean
  /**
   * Changes the placeholder text in the editor if no content is present.
   */
  placeholder?: LabelFunction | StaticLabel
}

export type LexicalFieldAdminClientProps = {
  placeholder?: string
} & Omit<LexicalFieldAdminProps, 'placeholder'>

export type FeaturesInput =
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
      defaultFeatures: FeatureProviderServer<any, any, any>[]
      /**
       * This array contains all features that are enabled in the root richText editor (the one defined in the payload.config.ts).
       * If this field is the root richText editor, or if the root richText editor is not a lexical editor, this array will be empty.
       *
       * @Example
       *
       * ```ts
       *  editor: lexicalEditor({
       *    features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature()],
       *  })
       *  ```
       */
      rootFeatures: FeatureProviderServer<any, any, any>[]
    }) => FeatureProviderServer<any, any, any>[])
  | FeatureProviderServer<any, any, any>[]

/**
 * @experimental - This API is experimental and may change in a minor release.
 * @internal
 */
export type LexicalEditorNodeMap = {
  [node: string]: {
    /**
     * Provide a react component to render the node. This will only work in the following cases:
     * - If used in a JSX converter: will always work
     * - If used in a Lexical Editor: will only work if the node is a DecoratorNode
     */
    Component?: (args: {}) => JSX.Element
    /**
     * Provide a function to create the DOM element for the node. This will only work in the following cases:
     * - If used in Lexical Editor: will always work. If the node is a DecoratorNode, both createDOM and `Component` will be used.
     */
    createDOM?: (args: {}) => HTMLElement
    /**
     * Provide a string to use as the HTML element for the node. This will only work in the following cases:
     * - If used in a JSX converter: will always work. This will be ignored if a `Component` is provided.
     * - If used in Lexical Editor: will always work. If the node is a DecoratorNode, both `html` and `Component` will be used. If `createDOM` is provided, this will be ignored.
     */
    html?: ((args: {}) => string) | string
  }
}

/**
 * A map of views, which can be used to render the editor in different ways.
 *
 * In order to override the default view, you can add a `default` key to the map.
 *
 * @experimental - This API is experimental and may change in a minor release.
 * @internal
 */
export type LexicalEditorViewMap = {
  [viewKey: string]: LexicalEditorNodeMap
}

/**
 * @todo rename to LexicalEditorArgs in 4.0, since these are arguments for the lexicalEditor function
 */
export type LexicalEditorProps = {
  admin?: LexicalFieldAdminProps
  features?: FeaturesInput
  lexical?: LexicalEditorConfig
  /**
   * A path to a LexicalEditorViewMap, which can be used to render the editor in different ways.
   *
   * In order to override the default view, you can add a `default` key to the map.
   *
   * @experimental - This API is experimental and may change in a minor release.
   * @internal
   */
  views?: PayloadComponent
}

export type LexicalRichTextAdapter = {
  editorConfig: SanitizedServerEditorConfig
  features: FeatureProviderServer<any, any, any>[]
} & RichTextAdapter<SerializedEditorState, AdapterProps>

export type LexicalRichTextAdapterProvider =
  /**
   * This is being called during the payload sanitization process
   */
  ({
    config,
    isRoot,
    parentIsLocalized,
  }: {
    config: SanitizedConfig
    isRoot?: boolean
    parentIsLocalized: boolean
  }) => Promise<LexicalRichTextAdapter>

export type SingleFeatureClientSchemaMap = {
  [key: string]: ClientField[]
}
export type FeatureClientSchemaMap = {
  [featureKey: string]: SingleFeatureClientSchemaMap
}

export type LexicalRichTextFieldProps = {
  admin?: LexicalFieldAdminClientProps
  // clientFeatures is added through the rsc field
  clientFeatures: {
    [featureKey: string]: {
      clientFeatureProps?: BaseClientFeatureProps<Record<string, any>>
      clientFeatureProvider?: FeatureProviderProviderClient<any, any>
    }
  }
  /**
   * Part of the import map that contains client components for all lexical features of this field that
   * have been added through `feature.componentImports`.
   */
  featureClientImportMap?: Record<string, any>
  featureClientSchemaMap: FeatureClientSchemaMap
  initialLexicalFormState: InitialLexicalFormState
  lexicalEditorConfig: LexicalEditorConfig | undefined // Undefined if default lexical editor config should be used
  views?: LexicalEditorViewMap
} & Pick<ServerFieldBase, 'permissions'> &
  RichTextFieldClientProps<SerializedEditorState, AdapterProps, object>

export type LexicalRichTextCellProps = DefaultServerCellComponentProps<
  RichTextFieldClient<SerializedEditorState, AdapterProps, object>,
  SerializedEditorState
>

export type AdapterProps = {
  editorConfig: SanitizedServerEditorConfig
}

export type GeneratedFeatureProviderComponent = {
  clientFeature: FeatureProviderProviderClient<any, any>
  clientFeatureProps: BaseClientFeatureProps<object>
}

export type LexicalRichTextField = RichTextField<SerializedEditorState, AdapterProps>
