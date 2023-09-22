import type { Klass, LexicalEditor, LexicalNode, RangeSelection } from 'lexical'
import type React from 'react'

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

export type SanitizedFeatures = Required<Pick<Feature, 'nodes' | 'plugins'>> & {
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
