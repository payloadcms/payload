import type { I18nClient } from '@payloadcms/translations'
import type { BaseSelection, LexicalEditor } from 'lexical'
import type React from 'react'

import type { EditorConfigContextType } from '../../lexical/config/client/EditorConfigProvider.js'
import type { FeatureClientSchemaMap } from '../../types.js'

export type ToolbarGroup = ToolbarButtonsGroup | ToolbarDropdownGroup

export type ToolbarDropdownGroup = {
  /**
   * The dropdown toolbar ChildComponent allows you to pass in a React Component which will be displayed within the dropdown button.
   */
  ChildComponent?: React.FC
  /**
   * This is optional and controls if the toolbar group is highlighted or not.
   */
  isEnabled?: ({
    editor,
    editorConfigContext,
    selection,
  }: {
    editor: LexicalEditor
    editorConfigContext: EditorConfigContextType
    selection: BaseSelection
  }) => boolean
  /**
   * All toolbar items part of this toolbar group need to be added here.
   */
  items: Array<ToolbarGroupItem>
  /**
   * Each toolbar group needs to have a unique key. Groups with the same keys will have their items merged together.
   */
  key: string
  /**
   * The maximum number of active items that can be selected at once.
   * Increasing this will hurt performance, as more nodes need to be checked for their active state.
   *
   * E.g. if this is 1, we can stop checking nodes once we find an active node.
   *
   * @default 1
   */
  maxActiveItems?: number
  /**
   * Determines where the toolbar group will be.
   */
  order?: number
  /**
   * Controls the toolbar group type. Set to `dropdown` to create a buttons toolbar group, which displays toolbar items vertically using their icons and labels, if the dropdown is open.
   */
  type: 'dropdown'
}

export type ToolbarButtonsGroup = {
  /**
   * All toolbar items part of this toolbar group need to be added here.
   */
  items: Array<ToolbarGroupItem>
  /**
   * Each toolbar group needs to have a unique key. Groups with the same keys will have their items merged together.
   */
  key: string
  /**
   * Determines where the toolbar group will be.
   */
  order?: number
  /**
   * Controls the toolbar group type. Set to `buttons` to create a buttons toolbar group, which displays toolbar items horizontally using only their icons.
   */
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
  label?:
    | ((args: {
        featureClientSchemaMap: FeatureClientSchemaMap
        i18n: I18nClient<{}, string>
        schemaPath: string
      }) => string)
    | string
  /** Each toolbar item needs to have a unique key. */
  onSelect?: ({ editor, isActive }: { editor: LexicalEditor; isActive: boolean }) => void
  order?: number
}
