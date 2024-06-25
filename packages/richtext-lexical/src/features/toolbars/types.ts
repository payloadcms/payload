import type { I18nClient } from '@payloadcms/translations'
import type { BaseSelection, LexicalEditor } from 'lexical'
import type React from 'react'

import type { EditorConfigContextType } from '../../lexical/config/client/EditorConfigProvider.js'

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
  /** A React component which is rendered within your toolbar item's default button component. Usually, you want this to be an icon. */
  ChildComponent?: React.FC
  /** A React component which is rendered in place of the toolbar item's default button component, thus completely replacing it. The `ChildComponent` and `onSelect` properties will be ignored. */
  Component?: React.FC<{
    active?: boolean
    anchorElem: HTMLElement
    editor: LexicalEditor
    enabled?: boolean
    item: ToolbarGroupItem
  }>
  /** This is optional and controls if the toolbar item is highlighted or not. */
  isActive?: ({
    editor,
    editorConfigContext,
    selection,
  }: {
    editor: LexicalEditor
    editorConfigContext: EditorConfigContextType
    selection: BaseSelection
  }) => boolean
  /** This is optional and controls if the toolbar item is clickable or not. If `false` is returned here, it will be grayed out and unclickable. */
  isEnabled?: ({
    editor,
    editorConfigContext,
    selection,
  }: {
    editor: LexicalEditor
    editorConfigContext: EditorConfigContextType
    selection: BaseSelection
  }) => boolean
  /** Each toolbar item needs to have a unique key. */
  key: string
  /** The label will be displayed in your toolbar item, if it's within a dropdown group. In order to make use of i18n, this can be a function. */
  label?: (({ i18n }: { i18n: I18nClient<{}, string> }) => string) | string
  /** Each toolbar item needs to have a unique key. */
  onSelect?: ({ editor, isActive }: { editor: LexicalEditor; isActive: boolean }) => void
  order?: number
}
