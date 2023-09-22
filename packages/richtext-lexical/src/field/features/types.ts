import type { LexicalEditor, RangeSelection } from 'lexical'
import type React from 'react'
import type { DeepRequired } from 'ts-essentials'

import type {
  SlashMenuGroup,
  SlashMenuOption,
} from '../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'

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

export type SanitizedFeatures = {
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
