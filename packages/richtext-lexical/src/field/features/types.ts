import type { Transformer } from '@lexical/markdown'
import type { JSONSchema4 } from 'json-schema'
import type { Klass, LexicalEditor, LexicalNode, SerializedEditorState } from 'lexical'
import type { SerializedLexicalNode } from 'lexical'
import type { LexicalNodeReplacement } from 'lexical'
import type { Payload, RequestContext } from 'payload'
import type { SanitizedConfig } from 'payload/config'
import type { PayloadRequest, RichTextField, ValidateOptions } from 'payload/types'
import type React from 'react'

import type { AdapterProps } from '../../types'
import type { EditorConfig } from '../lexical/config/types'
import type { FloatingToolbarSection } from '../lexical/plugins/FloatingSelectToolbar/types'
import type { SlashMenuGroup } from '../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import type { HTMLConverter } from './converters/html/converter/types'

export type PopulationPromise<T extends SerializedLexicalNode = SerializedLexicalNode> = ({
  context,
  currentDepth,
  depth,
  editorPopulationPromises,
  field,
  findMany,
  flattenLocales,
  node,
  overrideAccess,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: {
  context: RequestContext
  currentDepth: number
  depth: number
  draft: boolean
  /**
   * This maps all population promises to the node type
   */
  editorPopulationPromises: Map<string, Array<PopulationPromise>>
  field: RichTextField<SerializedEditorState, AdapterProps>
  findMany: boolean
  flattenLocales: boolean
  node: T
  overrideAccess: boolean
  populationPromises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
}) => Promise<void>[]

export type NodeValidation<T extends SerializedLexicalNode = SerializedLexicalNode> = ({
  node,
  nodeValidations,
  payloadConfig,
  validation,
}: {
  node: T
  nodeValidations: Map<string, Array<NodeValidation>>
  payloadConfig: SanitizedConfig
  validation: {
    options: ValidateOptions<SerializedEditorState, unknown, RichTextField, SerializedEditorState>
    value: SerializedEditorState
  }
}) => Promise<string | true> | string | true

export type Feature = {
  floatingSelectToolbar?: {
    sections: FloatingToolbarSection[]
  }
  generatedTypes?: {
    modifyOutputSchema: ({
      collectionIDFieldTypes,
      config,
      currentSchema,
      field,
      interfaceNameDefinitions,
      isRequired,
      payload,
    }: {
      collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
      config?: SanitizedConfig
      /**
       * Current schema which will be modified by this function.
       */
      currentSchema: JSONSchema4
      field: RichTextField<SerializedEditorState, AdapterProps>
      /**
       * Allows you to define new top-level interfaces that can be re-used in the output schema.
       */
      interfaceNameDefinitions: Map<string, JSONSchema4>
      isRequired: boolean
      payload?: Payload
    }) => JSONSchema4
  }
  hooks?: {
    afterReadPromise?: ({
      field,
      incomingEditorState,
      siblingDoc,
    }: {
      field: RichTextField<SerializedEditorState, AdapterProps>
      incomingEditorState: SerializedEditorState
      siblingDoc: Record<string, unknown>
    }) => Promise<void> | null
    load?: ({
      incomingEditorState,
    }: {
      incomingEditorState: SerializedEditorState
    }) => SerializedEditorState
    save?: ({
      incomingEditorState,
    }: {
      incomingEditorState: SerializedEditorState
    }) => SerializedEditorState
  }
  markdownTransformers?: Transformer[]
  nodes?: Array<{
    converters?: {
      html?: HTMLConverter
    }
    node: Klass<LexicalNode> | LexicalNodeReplacement
    populationPromises?: Array<PopulationPromise>
    type: string
    validations?: Array<NodeValidation>
  }>
  plugins?: Array<
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: () => Promise<React.FC<{ anchorElem: HTMLElement }>>
        position: 'floatingAnchorElem' // Determines at which position the Component will be added.
      }
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: () => Promise<React.FC>
        position: 'bottom' // Determines at which position the Component will be added.
      }
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: () => Promise<React.FC>
        position: 'normal' // Determines at which position the Component will be added.
      }
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: () => Promise<React.FC>
        position: 'top' // Determines at which position the Component will be added.
      }
  >

  /** Props which were passed into your feature will have to be passed here. This will allow them to be used / read in other places of the code, e.g. wherever you can use useEditorConfigContext */
  props: unknown
  slashMenu?: {
    dynamicOptions?: ({
      editor,
      queryString,
    }: {
      editor: LexicalEditor
      queryString: string
    }) => SlashMenuGroup[]
    options?: SlashMenuGroup[]
  }
}

export type FeatureProvider = {
  /** Keys of dependencies needed for this feature. These dependencies do not have to be loaded first */
  dependencies?: string[]
  /** Keys of priority dependencies needed for this feature. These dependencies have to be loaded first and are available in the `feature` property*/
  dependenciesPriority?: string[]
  /** Keys of soft-dependencies needed for this feature. These dependencies are optional, but are considered as last-priority in the loading process */
  dependenciesSoft?: string[]

  feature: (props: {
    /** unsanitizedEditorConfig.features, but mapped */
    featureProviderMap: FeatureProviderMap
    // other resolved features, which have been loaded before this one. All features declared in 'dependencies' should be available here
    resolvedFeatures: ResolvedFeatureMap
    // unsanitized EditorConfig,
    unsanitizedEditorConfig: EditorConfig
  }) => Feature
  key: string
}

export type ResolvedFeature = Feature &
  Required<
    Pick<FeatureProvider, 'dependencies' | 'dependenciesPriority' | 'dependenciesSoft' | 'key'>
  >

export type ResolvedFeatureMap = Map<string, ResolvedFeature>

export type FeatureProviderMap = Map<string, FeatureProvider>

export type SanitizedPlugin =
  | {
      // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
      Component: () => Promise<React.FC<{ anchorElem: HTMLElement }>>
      desktopOnly?: boolean
      key: string
      position: 'floatingAnchorElem' // Determines at which position the Component will be added.
    }
  | {
      // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
      Component: () => Promise<React.FC>
      key: string
      position: 'bottom' // Determines at which position the Component will be added.
    }
  | {
      // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
      Component: () => Promise<React.FC>
      key: string
      position: 'normal' // Determines at which position the Component will be added.
    }
  | {
      // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
      Component: () => Promise<React.FC>
      key: string
      position: 'top' // Determines at which position the Component will be added.
    }

export type SanitizedFeatures = Required<
  Pick<ResolvedFeature, 'markdownTransformers' | 'nodes'>
> & {
  /**  The node types mapped to their converters */
  converters: {
    html: HTMLConverter[]
  }
  /** The keys of all enabled features */
  enabledFeatures: string[]
  floatingSelectToolbar: {
    sections: FloatingToolbarSection[]
  }
  generatedTypes: {
    modifyOutputSchemas: Array<
      ({
        collectionIDFieldTypes,
        config,
        currentSchema,
        field,
        interfaceNameDefinitions,
        isRequired,
        payload,
      }: {
        collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
        config?: SanitizedConfig
        /**
         * Current schema which will be modified by this function.
         */
        currentSchema: JSONSchema4
        field: RichTextField<SerializedEditorState, AdapterProps>
        /**
         * Allows you to define new top-level interfaces that can be re-used in the output schema.
         */
        interfaceNameDefinitions: Map<string, JSONSchema4>
        isRequired: boolean
        payload?: Payload
      }) => JSONSchema4
    >
  }
  hooks: {
    afterReadPromises: Array<
      ({
        field,
        incomingEditorState,
        siblingDoc,
      }: {
        field: RichTextField<SerializedEditorState, AdapterProps>
        incomingEditorState: SerializedEditorState
        siblingDoc: Record<string, unknown>
      }) => Promise<void> | null
    >
    load: Array<
      ({
        incomingEditorState,
      }: {
        incomingEditorState: SerializedEditorState
      }) => SerializedEditorState
    >
    save: Array<
      ({
        incomingEditorState,
      }: {
        incomingEditorState: SerializedEditorState
      }) => SerializedEditorState
    >
  }
  plugins?: Array<SanitizedPlugin>
  /**  The node types mapped to their populationPromises */
  populationPromises: Map<string, Array<PopulationPromise>>
  slashMenu: {
    dynamicOptions: Array<
      ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => SlashMenuGroup[]
    >
    groupsWithOptions: SlashMenuGroup[]
  }
  /**  The node types mapped to their validations */
  validations: Map<string, Array<NodeValidation>>
}
