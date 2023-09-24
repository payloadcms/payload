import type { Transformer } from '@lexical/markdown'
import type { Klass, LexicalEditor, LexicalNode, RangeSelection } from 'lexical'
import type React from 'react'

import type { EditorConfig } from '..//lexical/config/types'
import type { SlashMenuGroup } from '../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'

export type Feature = {
  floatingSelectToolbar?: {
    buttons?: {
      format?: {
        ChildComponent?: React.FC
        /** Use component to ignore the children and onClick properties. It does not use the default, pre-defined format Button component */
        Component?: React.FC<{
          activeStates: Map<string, boolean>
          anchorElem: HTMLElement
          editor: LexicalEditor
        }>
        isActive?: (editor: LexicalEditor, selection: RangeSelection) => boolean
        key: string
        onClick?: (editor: LexicalEditor) => void
      }[]
    }
  }
  markdownTransformers?: Transformer[]
  nodes?: Array<Klass<LexicalNode>>

  plugins?: Array<{
    // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
    Component: React.FC
    position: 'normal' // Determines at which position the Component will be added.
  }>
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
  Pick<ResolvedFeature, 'markdownTransformers' | 'nodes' | 'plugins'>
> & {
  /** The keys of all enabled features */
  enabledFeatures: string[]
  floatingSelectToolbar: {
    buttons: {
      format: {
        ChildComponent?: React.FC
        /** Use component to ignore the children and onClick properties. It does not use the default, pre-defined format Button component */
        Component?: React.FC<{
          activeStates: Map<string, boolean>
          anchorElem: HTMLElement
          editor: LexicalEditor
        }>
        isActive?: (editor: LexicalEditor, selection: RangeSelection) => boolean
        key: string
        onClick?: (editor: LexicalEditor) => void
      }[]
    }
  }
  slashMenu: {
    dynamicOptions: Array<
      ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => SlashMenuGroup[]
    >
    groupsWithOptions: SlashMenuGroup[]
  }
}
