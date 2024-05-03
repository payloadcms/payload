import type { I18n } from '@payloadcms/translations'
import type { BaseSelection, LexicalEditor } from 'lexical'
import type React from 'react'

import type { EditorFocusContextType } from '../../lexical/EditorFocusProvider.js'

export type ToolbarGroup =
  | {
      ChildComponent?: React.FC
      items: Array<ToolbarGroupItem>
      key: string
      order?: number
      type: 'dropdown'
    }
  | {
      items: Array<ToolbarGroupItem>
      key: string
      order?: number
      type: 'buttons'
    }

export type ToolbarGroupItem = {
  ChildComponent?: React.FC
  /** Use component to ignore the children and onClick properties. It does not use the default, pre-defined format Button component */
  Component?: React.FC<{
    active?: boolean
    anchorElem: HTMLElement
    editor: LexicalEditor
    enabled?: boolean
    item: ToolbarGroupItem
  }>
  isActive?: ({
    editor,
    editorFocusContext,
    selection,
  }: {
    editor: LexicalEditor
    editorFocusContext: EditorFocusContextType
    selection: BaseSelection
  }) => boolean
  isEnabled?: ({
    editor,
    editorFocusContext,
    selection,
  }: {
    editor: LexicalEditor
    editorFocusContext: EditorFocusContextType
    selection: BaseSelection
  }) => boolean
  key: string
  /** The label is displayed as text if the item is part of a dropdown group */
  label?: (({ i18n }: { i18n: I18n }) => string) | string
  onSelect?: ({ editor, isActive }: { editor: LexicalEditor; isActive: boolean }) => void
  order?: number
}
