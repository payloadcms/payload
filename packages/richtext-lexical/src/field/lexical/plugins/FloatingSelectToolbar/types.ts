import type { BaseSelection, LexicalEditor } from 'lexical'
import type React from 'react'

export type FloatingToolbarSection =
  | {
      ChildComponent?: () => Promise<React.FC>
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
  ChildComponent?: () => Promise<React.FC>
  /** Use component to ignore the children and onClick properties. It does not use the default, pre-defined format Button component */
  Component?: () => Promise<
    React.FC<{
      anchorElem: HTMLElement
      editor: LexicalEditor
      entry: FloatingToolbarSectionEntry
    }>
  >
  isActive?: ({ editor, selection }: { editor: LexicalEditor; selection: BaseSelection }) => boolean
  isEnabled?: ({
    editor,
    selection,
  }: {
    editor: LexicalEditor
    selection: BaseSelection
  }) => boolean
  key: string
  /** The label is displayed as text if the entry is part of a dropdown section */
  label?: string
  onClick?: ({ editor, isActive }: { editor: LexicalEditor; isActive: boolean }) => void
  order?: number
}
