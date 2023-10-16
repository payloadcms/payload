import type { Transformer } from '@lexical/markdown'
import type { Klass, LexicalEditor, LexicalNode, SerializedEditorState } from 'lexical'
import type { SerializedLexicalNode } from 'lexical'
import type { SanitizedConfig } from 'payload/config'
import type { PayloadRequest, RichTextField, ValidateOptions } from 'payload/types'
import type React from 'react'

import type { AdapterProps } from '../../types'
import type { EditorConfig } from '../lexical/config/types'
import type { FloatingToolbarSection } from '../lexical/plugins/FloatingSelectToolbar/types'
import type { SlashMenuGroup } from '../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'

export type PopulationPromise<T extends SerializedLexicalNode = SerializedLexicalNode> = ({
  currentDepth,
  depth,
  field,
  node,
  overrideAccess,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: {
  currentDepth: number
  depth: number
  field: RichTextField<SerializedEditorState, AdapterProps>
  node: T
  overrideAccess: boolean
  populationPromises: Map<string, Array<PopulationPromise>>
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
    options: ValidateOptions<SerializedEditorState, unknown, RichTextField>
    value: SerializedEditorState
  }
}) => Promise<string | true> | string | true

export type Feature = {
  floatingSelectToolbar?: {
    sections: FloatingToolbarSection[]
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
    node: Klass<LexicalNode>
    populationPromises?: Array<PopulationPromise>
    type: string
    validations?: Array<NodeValidation>
  }>
  plugins?: Array<
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: React.FC
        position: 'normal' // Determines at which position the Component will be added.
      }
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: React.FC<{ anchorElem: HTMLElement }>
        position: 'floatingAnchorElem' // Determines at which position the Component will be added.
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

export type SanitizedFeatures = Required<
  Pick<ResolvedFeature, 'markdownTransformers' | 'nodes'>
> & {
  /** The keys of all enabled features */
  enabledFeatures: string[]
  floatingSelectToolbar: {
    sections: FloatingToolbarSection[]
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
  plugins?: Array<
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: React.FC
        key: string
        position: 'normal' // Determines at which position the Component will be added.
      }
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: React.FC<{ anchorElem: HTMLElement }>
        desktopOnly?: boolean
        key: string
        position: 'floatingAnchorElem' // Determines at which position the Component will be added.
      }
  >
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
