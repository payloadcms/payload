import type {
  DecoratorNode,
  EditorConfig,
  LexicalEditor,
  EditorConfig as LexicalEditorConfig,
  LexicalNode,
  SerializedEditorState,
  SerializedLexicalNode,
} from 'lexical'
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

import type { JSXConverterArgs } from './features/converters/lexicalToJSX/converter/types.js'
import type {
  BaseClientFeatureProps,
  FeatureProviderProviderClient,
} from './features/typesClient.js'
import type { FeatureProviderServer } from './features/typesServer.js'
import type { SanitizedServerEditorConfig } from './lexical/config/types.js'
import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from './nodeTypes.js'
import type { InitialLexicalFormState } from './utilities/buildInitialState.js'

/**
 * Base constraint for serialized Lexical node types.
 * Used as the generic constraint for node map types.
 * Extends the base SerializedLexicalNode with optional type for flexibility.
 */
export type SerializedNodeBase = { [key: string]: unknown; type?: string }

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

type WithinEditorArgs = {
  config: EditorConfig
  editor: LexicalEditor
  node: LexicalNode
}

/**
 *
 * @experimental - This API is experimental and may change in a minor release.
 * @internal
 */
export type NodeMapValue<TNode extends SerializedNodeBase = SerializedLexicalNode> = {
  /**
   * Provide a react component to render the node.
   *
   * **JSX Converter:** Always works. Takes priority over `html`.
   *
   * **Lexical Editor:** Only works for DecoratorNodes (renders in `decorate` method). Takes priority over `html` and `createDOM`.
   */
  Component?: (
    args:
      | ({
          isEditor: false
          isJSXConverter: true
        } & JSXConverterArgs<TNode>)
      | ({
          isEditor: true
          isJSXConverter: false
          node: {
            _originalDecorate?: (editor: LexicalEditor, config: EditorConfig) => React.ReactNode
          } & DecoratorNode<React.ReactNode>
        } & Omit<WithinEditorArgs, 'node'>),
  ) => React.ReactNode
  /**
   * Provide a function to create the DOM element for the node.
   *
   * **JSX Converter:** Not used (only `Component` and `html` work).
   *
   * **Lexical Editor:** Always works (renders in `createDOM` method).
   * - For ElementNodes: This is the standard way to customize rendering.
   * - For DecoratorNodes: When combined with `html`, the DOM gets custom structure while `decorate` renders the `html` content.
   */
  createDOM?: (args: WithinEditorArgs) => HTMLElement
  /**
   * Provide HTML string or function to render the node.
   *
   * **JSX Converter:** Always works (ignored if `Component` is provided).
   *
   * **Lexical Editor behavior depends on node type:**
   *
   * - **ElementNodes:** `html` is used in `createDOM` to generate the DOM structure.
   *
   * - **DecoratorNodes (have both `createDOM` and `decorate`):**
   *   - If only `html` is provided: `createDOM` uses `html` to create DOM, `decorate` returns `null`
   *   - If `html` + `Component`: `createDOM` uses `html`, `decorate` uses `Component`
   *   - If `html` + `createDOM`: Custom `createDOM` creates structure, `decorate` renders `html` content
   *   - If `html` + `Component` + `createDOM`: Custom `createDOM` creates structure, `decorate` uses `Component` (html ignored in editor)
   */
  html?: (
    args:
      | ({
          isEditor: false
          isJSXConverter: true
        } & JSXConverterArgs<TNode>)
      | ({
          isEditor: true
          isJSXConverter: false
        } & WithinEditorArgs),
  ) => string
}

/**
 * Props passed to custom Block components in view maps.
 * Similar to Component props but for block-level customization.
 *
 * For React UI props (BlockCollapsible, EditButton, etc.), use the
 * `useBlockComponentContext()` hook inside your component.
 *
 * @experimental - This API is experimental and may change in a minor release.
 */
export type ViewMapBlockComponentProps = {
  /**
   * The Lexical editor configuration.
   */
  config: EditorConfig
  /**
   * The Lexical editor instance.
   */
  editor: LexicalEditor
  /**
   * The block's form data (field values).
   */
  formData: Record<string, unknown>
  /**
   * Always true when rendering in the editor.
   */
  isEditor: true
  /**
   * Always false when rendering in the editor (true only in JSX converter).
   */
  isJSXConverter: false
  /**
   * The Lexical block node instance.
   */
  node: DecoratorNode<React.ReactNode>
  /**
   * The unique key identifying this block node.
   */
  nodeKey: string
}

/**
 *
 * @experimental - This API is experimental and may change in a minor release.
 * @internal
 */
export type NodeMapBlockValue<TNode extends SerializedNodeBase = SerializedLexicalNode> = {
  /**
   * A React component that replaces the entire block, including the header/collapsible.
   * Receives Lexical-level props (editor, config, node, formData, nodeKey).
   *
   * For React UI props (BlockCollapsible, EditButton, RemoveButton, etc.),
   * use the `useBlockComponentContext()` hook inside your component.
   */
  Block?: React.FC<ViewMapBlockComponentProps>
  /**
   * A React component that replaces the block label.
   * Use `useBlockComponentContext()` hook to access block context.
   */
  Label?: React.FC
} & Pick<NodeMapValue<TNode>, 'Component' | 'createDOM' | 'html'>

/**
 * @experimental - This API is experimental and may change in a minor release.
 * @internal
 */
export type LexicalEditorNodeMap<
  TNodes extends SerializedNodeBase =
    | DefaultNodeTypes
    | SerializedBlockNode<{ blockName?: null | string; blockType: string }> // need these to ensure types for blocks and inlineBlocks work if no generics are provided
    | SerializedInlineBlockNode<{ blockName?: null | string; blockType: string }>, // need these to ensure types for blocks and inlineBlocks work if no generics are provided
> = {
  // The index signature must include NodeMapBlockValue in the nested blockSlug mapping because
  // 'blocks' and 'inlineBlocks' properties use NodeMapBlockValue (which adds Block/Label props).
  // TypeScript requires that intersection properties be assignable to index signatures.
  [key: string]:
    | {
        [blockSlug: string]: NodeMapBlockValue<any> | NodeMapValue<any>
      }
    | NodeMapValue<any>
    | undefined
} & {
  [nodeType in Exclude<NonNullable<TNodes['type']>, 'block' | 'inlineBlock'>]?: NodeMapValue<
    Extract<TNodes, { type: nodeType }>
  >
} & {
  blocks?: {
    [K in Extract<
      Extract<TNodes, { type: 'block' }> extends SerializedBlockNode<infer B>
        ? B extends { blockType: string }
          ? B['blockType']
          : never
        : never,
      string
    >]?: NodeMapBlockValue<
      Extract<TNodes, { type: 'block' }> extends SerializedBlockNode<infer B>
        ? SerializedBlockNode<Extract<B, { blockType: K }>>
        : SerializedBlockNode
    >
  }
  inlineBlocks?: {
    [K in Extract<
      Extract<TNodes, { type: 'inlineBlock' }> extends SerializedInlineBlockNode<infer B>
        ? B extends { blockType: string }
          ? B['blockType']
          : never
        : never,
      string
    >]?: NodeMapBlockValue<
      Extract<TNodes, { type: 'inlineBlock' }> extends SerializedInlineBlockNode<infer B>
        ? SerializedInlineBlockNode<Extract<B, { blockType: K }>>
        : SerializedInlineBlockNode
    >
  }
  unknown?: NodeMapValue<SerializedLexicalNode>
}

/**
 * A map of views, which can be used to render the editor in different ways.
 *
 * In order to override the default view, you can add a `default` key to the map.
 *
 * @experimental - This API is experimental and may change in a minor release.
 * @internal
 */
export type LexicalEditorViewMap<
  TNodes extends SerializedNodeBase =
    | DefaultNodeTypes
    | SerializedBlockNode<{ blockName?: null | string; blockType: string }> // need these to ensure types for blocks and inlineBlocks work if no generics are provided
    | SerializedInlineBlockNode<{ blockName?: null | string; blockType: string }>, // need these to ensure types for blocks and inlineBlocks work if no generics are provided
> = {
  [viewKey: string]: {
    admin?: LexicalFieldAdminClientProps
    lexical?: LexicalEditorConfig
    nodes: LexicalEditorNodeMap<TNodes>
  }
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
