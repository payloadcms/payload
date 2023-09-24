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
  isActive?: ({
    editor,
    selection,
  }: {
    editor: LexicalEditor
    selection: RangeSelection
  }) => boolean
  key: string
  /** The label is displayed as text if the entry is part of a dropdown section */
  label?: string
  onClick?: ({ editor }: { editor: LexicalEditor }) => void
  order?: number
}
