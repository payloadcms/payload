import type {
  Klass,
  LexicalEditor,
  LexicalNode,
  LexicalNodeReplacement,
  TextFormatType,
} from 'lexical'
import type { ClientConfig, RichTextFieldClient } from 'payload'
import type React from 'react'
import type { JSX } from 'react'

import type { ClientEditorConfig } from '../lexical/config/types.js'
import type { SlashMenuGroup } from '../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import type { Transformer } from '../packages/@lexical/markdown/index.js'
import type { FeatureClientSchemaMap } from '../types.js'
import type { ToolbarGroup } from './toolbars/types.js'

export type FeatureProviderProviderClient<
  UnSanitizedClientFeatureProps = undefined,
  ClientFeatureProps = UnSanitizedClientFeatureProps,
> = (props: BaseClientFeatureProps<ClientFeatureProps>) => FeatureProviderClient<ClientFeatureProps>

/**
 * No dependencies => Features need to be sorted on the server first, then sent to client in right order
 */
export type FeatureProviderClient<
  UnSanitizedClientFeatureProps = undefined,
  ClientFeatureProps = UnSanitizedClientFeatureProps,
> = {
  /**
   * Return props, to make it easy to retrieve passed in props to this Feature for the client if anyone wants to
   */
  clientFeatureProps: BaseClientFeatureProps<UnSanitizedClientFeatureProps>
  feature:
    | ((props: {
        config: ClientConfig
        featureClientImportMap: Record<string, any>
        featureClientSchemaMap: FeatureClientSchemaMap
        /** unSanitizedEditorConfig.features, but mapped */
        featureProviderMap: ClientFeatureProviderMap
        field?: RichTextFieldClient
        // other resolved features, which have been loaded before this one. All features declared in 'dependencies' should be available here
        resolvedFeatures: ResolvedClientFeatureMap
        schemaPath: string
        // unSanitized EditorConfig,
        unSanitizedEditorConfig: ClientEditorConfig
      }) => ClientFeature<ClientFeatureProps>)
    | ClientFeature<ClientFeatureProps>
}

export type PluginComponent<ClientFeatureProps = any> = React.FC<{
  clientProps: ClientFeatureProps
}>
export type PluginComponentWithAnchor<ClientFeatureProps = any> = React.FC<{
  anchorElem: HTMLElement
  clientProps: ClientFeatureProps
}>

/**
 * Plugins are react components which get added to the editor. You can use them to interact with lexical, e.g. to create a command which creates a node, or opens a modal, or some other more "outside" functionality
 */
export type SanitizedPlugin =
  | {
      clientProps: any
      // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
      Component: PluginComponent
      key: string
      position: 'bottom' // Determines at which position the Component will be added.
    }
  | {
      clientProps: any
      // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
      Component: PluginComponent
      key: string
      position: 'normal' // Determines at which position the Component will be added.
    }
  | {
      clientProps: any
      // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
      Component: PluginComponent
      key: string
      position: 'top' // Determines at which position the Component will be added.
    }
  | {
      clientProps: any
      // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
      Component: PluginComponentWithAnchor
      desktopOnly?: boolean
      key: string
      position: 'floatingAnchorElem' // Determines at which position the Component will be added.
    }
  | {
      clientProps: any
      Component: PluginComponent
      key: string
      position: 'aboveContainer'
    }
  | {
      clientProps: any
      Component: PluginComponent
      key: string
      position: 'belowContainer'
    }

export type ClientFeature<ClientFeatureProps> = {
  /**
   * The text formats which are enabled by this feature.
   */
  enableFormats?: TextFormatType[]
  markdownTransformers?: (
    | ((props: {
        allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>
        allTransformers: Transformer[]
      }) => Transformer)
    | Transformer
  )[]
  nodes?: Array<Klass<LexicalNode> | LexicalNodeReplacement>
  /**
   * Plugins are react components which get added to the editor. You can use them to interact with lexical, e.g. to create a command which creates a node, or opens a modal, or some other more "outside" functionality
   */
  plugins?: Array<
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: PluginComponent<ClientFeatureProps>
        position: 'aboveContainer' // Determines at which position the Component will be added.
      }
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: PluginComponent<ClientFeatureProps>
        position: 'bottom' // Determines at which position the Component will be added.
      }
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: PluginComponent<ClientFeatureProps>
        position: 'normal' // Determines at which position the Component will be added.
      }
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: PluginComponent<ClientFeatureProps>
        position: 'top' // Determines at which position the Component will be added.
      }
    | {
        // plugins are anything which is not directly part of the editor. Like, creating a command which creates a node, or opens a modal, or some other more "outside" functionality
        Component: PluginComponentWithAnchor<ClientFeatureProps>
        position: 'floatingAnchorElem' // Determines at which position the Component will be added.
      }
    | {
        Component: PluginComponent<ClientFeatureProps>
        position: 'belowContainer' // Determines at which position the Component will be added.
      }
  >
  /**
   * Client Features can register their own providers, which will be nested below the EditorConfigProvider
   */
  providers?: Array<React.FC<{ children: JSX.Element }>>
  /**
   * Return props, to make it easy to retrieve passed in props to this Feature for the client if anyone wants to
   */
  sanitizedClientFeatureProps?: BaseClientFeatureProps<ClientFeatureProps>
  slashMenu?: {
    /**
     * Dynamic groups allow you to add different groups depending on the query string (so, the text after the slash).
     * Thus, to re-calculate the available groups, this function will be called every time you type after the /.
     *
     * The groups provided by dynamicGroups will be merged with the static groups provided by the groups property.
     */
    dynamicGroups?: ({
      editor,
      queryString,
    }: {
      editor: LexicalEditor
      queryString: string
    }) => SlashMenuGroup[]
    /**
     * Static array of groups together with the items in them. These will always be present.
     * While typing after the /, they will be filtered by the query string and the keywords, key and display name of the items.
     */
    groups?: SlashMenuGroup[]
  }
  /**
   * An opt-in, classic fixed toolbar which stays at the top of the editor
   */
  toolbarFixed?: {
    groups: ToolbarGroup[]
  }
  /**
   * The default, floating toolbar which appears when you select text.
   */
  toolbarInline?: {
    /**
     * Array of toolbar groups / sections. Each section can contain multiple toolbar items.
     */
    groups: ToolbarGroup[]
  }
}

export type BaseClientFeatureProps<ClientFeatureProps> = ClientFeatureProps extends undefined
  ? {
      featureKey: string
      order: number
    }
  : {
      featureKey: string
      order: number
    } & ClientFeatureProps

export type ResolvedClientFeature<ClientFeatureProps> = {
  key: string
  order: number
} & ClientFeature<ClientFeatureProps>

export type ResolvedClientFeatureMap = Map<string, ResolvedClientFeature<any>>

export type ClientFeatureProviderMap = Map<string, FeatureProviderClient<any, any>>

export type SanitizedClientFeatures = {
  /** The keys of all enabled features */
  enabledFeatures: string[]
  enabledFormats: TextFormatType[]
  markdownTransformers: Transformer[]

  /**
   * Plugins are react components which get added to the editor. You can use them to interact with lexical, e.g. to create a command which creates a node, or opens a modal, or some other more "outside" functionality
   */
  plugins?: Array<SanitizedPlugin>
  slashMenu: {
    /**
     * Dynamic groups allow you to add different groups depending on the query string (so, the text after the slash).
     * Thus, to re-calculate the available groups, this function will be called every time you type after the /.
     *
     * The groups provided by dynamicGroups will be merged with the static groups provided by the groups property.
     */
    dynamicGroups: Array<
      ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => SlashMenuGroup[]
    >
    /**
     * Static array of groups together with the items in them. These will always be present.
     * While typing after the /, they will be filtered by the query string and the keywords, key and display name of the items.
     */
    groups: SlashMenuGroup[]
  }
} & Required<
  Pick<ResolvedClientFeature<unknown>, 'nodes' | 'providers' | 'toolbarFixed' | 'toolbarInline'>
>
