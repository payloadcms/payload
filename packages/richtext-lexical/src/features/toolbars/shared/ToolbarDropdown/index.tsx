'use client'
import React, { useCallback, useEffect } from 'react'

const baseClass = 'toolbar-popup__dropdown'

import type { LexicalEditor } from 'lexical'

import { mergeRegister } from '@lexical/utils'
import { useTranslation } from '@payloadcms/ui'
import { $getSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroupItem } from '../../types.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { DropDown, DropDownItem } from './DropDown.js'
import './index.scss'

const ToolbarItem = ({
  active,
  anchorElem,
  editor,
  enabled,
  item,
}: {
  active?: boolean
  anchorElem: HTMLElement
  editor: LexicalEditor
  enabled?: boolean
  item: ToolbarGroupItem
}) => {
  const { i18n } = useTranslation<{}, string>()
  const {
    fieldProps: { featureClientSchemaMap, schemaPath },
  } = useEditorConfigContext()

  if (item.Component) {
    return (
      item?.Component && (
        <item.Component
          active={active}
          anchorElem={anchorElem}
          editor={editor}
          enabled={enabled}
          item={item}
          key={item.key}
        />
      )
    )
  }

  let title = item.key
  let croppedTitle = item.key
  if (item.label) {
    title =
      typeof item.label === 'function'
        ? item.label({ featureClientSchemaMap, i18n, schemaPath })
        : item.label
  }
  // Crop title to max. 25 characters
  if (title.length > 25) {
    croppedTitle = title.substring(0, 25) + '...'
  } else {
    croppedTitle = title
  }

  return (
    <DropDownItem
      active={active}
      editor={editor}
      enabled={enabled}
      Icon={item?.ChildComponent ? <item.ChildComponent /> : undefined}
      item={item}
      key={item.key}
      tooltip={title}
    >
      <span className="text">{croppedTitle}</span>
    </DropDownItem>
  )
}

export const ToolbarDropdown = ({
  anchorElem,
  classNames,
  editor,
  group,
  Icon,
  itemsContainerClassNames,
  label,
  maxActiveItems,
  onActiveChange,
}: {
  anchorElem: HTMLElement
  classNames?: string[]
  editor: LexicalEditor
  group: ToolbarDropdownGroup
  Icon?: React.FC
  itemsContainerClassNames?: string[]
  label?: string
  /**
   * Maximum number of active items allowed. This is a performance optimization to prevent
   * unnecessary item active checks when the maximum number of active items is reached.
   */
  maxActiveItems?: number
  onActiveChange?: ({ activeItems }: { activeItems: ToolbarGroupItem[] }) => void
}) => {
  const [activeItemKeys, setActiveItemKeys] = React.useState<string[]>([])
  const [enabledItemKeys, setEnabledItemKeys] = React.useState<string[]>([])
  const [enabledGroup, setEnabledGroup] = React.useState<boolean>(true)
  const editorConfigContext = useEditorConfigContext()
  const { items, key: groupKey } = group

  const updateStates = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!selection) {
        return
      }

      const _activeItemKeys: string[] = []
      const _activeItems: ToolbarGroupItem[] = []
      const _enabledItemKeys: string[] = []

      for (const item of items) {
        if (item.isActive && (!maxActiveItems || _activeItemKeys.length < maxActiveItems)) {
          const isActive = item.isActive({ editor, editorConfigContext, selection })
          if (isActive) {
            _activeItemKeys.push(item.key)
            _activeItems.push(item)
          }
        }
        if (item.isEnabled) {
          const isEnabled = item.isEnabled({ editor, editorConfigContext, selection })
          if (isEnabled) {
            _enabledItemKeys.push(item.key)
          }
        } else {
          _enabledItemKeys.push(item.key)
        }
      }
      if (group.isEnabled) {
        setEnabledGroup(group.isEnabled({ editor, editorConfigContext, selection }))
      }
      setActiveItemKeys(_activeItemKeys)
      setEnabledItemKeys(_enabledItemKeys)

      if (onActiveChange) {
        onActiveChange({ activeItems: _activeItems })
      }
    })
  }, [editor, editorConfigContext, group, items, maxActiveItems, onActiveChange])

  useEffect(() => {
    updateStates()
  }, [updateStates])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updateStates()
      }),
    )
  }, [editor, updateStates])

  return (
    <DropDown
      buttonAriaLabel={`${groupKey} dropdown`}
      buttonClassName={[baseClass, `${baseClass}-${groupKey}`, ...(classNames || [])]
        .filter(Boolean)
        .join(' ')}
      disabled={!enabledGroup}
      Icon={Icon}
      itemsContainerClassNames={[`${baseClass}-items`, ...(itemsContainerClassNames || [])]}
      key={groupKey}
      label={label}
    >
      {items.length
        ? items.map((item) => {
            return (
              <ToolbarItem
                active={activeItemKeys.includes(item.key)}
                anchorElem={anchorElem}
                editor={editor}
                enabled={enabledItemKeys.includes(item.key)}
                item={item}
                key={item.key}
              />
            )
          })
        : null}
    </DropDown>
  )
}
