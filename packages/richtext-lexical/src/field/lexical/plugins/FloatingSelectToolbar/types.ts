import type { LexicalEditor, RangeSelection } from 'lexical'

export type FloatingToolbarSection =
  | {
      ChildComponent?: React.FC
      entries: Array<FloatingToolbarSectionEntry>
      key: string
      order?: number
      type: 'dropdown'
    }
  | {
      entries: Array<FloatingToolbarSectionEntry>
      key: string
      order?: number
      type: 'buttons'
    }

export type FloatingToolbarSectionEntry = {
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
  order?: number
}
