import type { BaseSelection, LexicalEditor } from 'lexical'
import type React from 'react'

export type InlineToolbarGroup =
  | {
      ChildComponent?: React.FC
      items: Array<InlineToolbarGroupItem>
      key: string
      order?: number
      type: 'dropdown'
    }
  | {
      items: Array<InlineToolbarGroupItem>
      key: string
      order?: number
      type: 'buttons'
    }

export type InlineToolbarGroupItem = {
  ChildComponent?: React.FC
  /** Use component to ignore the children and onClick properties. It does not use the default, pre-defined format Button component */
  Component?: React.FC<{
    anchorElem: HTMLElement
    editor: LexicalEditor
    item: InlineToolbarGroupItem
  }>
  isActive?: ({ editor, selection }: { editor: LexicalEditor; selection: BaseSelection }) => boolean
  isEnabled?: ({
    editor,
    selection,
  }: {
    editor: LexicalEditor
    selection: BaseSelection
  }) => boolean
  key: string
  /** The label is displayed as text if the item is part of a dropdown group */
  label?: string
  onSelect?: ({ editor, isActive }: { editor: LexicalEditor; isActive: boolean }) => void
  order?: number
}
