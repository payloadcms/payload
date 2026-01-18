'use client'
import React, { useCallback, useDeferredValue, useEffect, useMemo } from 'react'

const baseClass = 'toolbar-popup__dropdown'

import type { LexicalEditor } from 'lexical'

import { mergeRegister } from '@lexical/utils'
import { useTranslation } from '@ruya.sa/ui'
import { $getSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroupItem } from '../../types.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useRunDeprioritized } from '../../../../utilities/useRunDeprioritized.js'
import './index.scss'
import { DropDown, DropDownItem } from './DropDown.js'

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
      itemKey={item.key}
      key={item.key}
      tooltip={title}
    >
      <span className="text">{croppedTitle}</span>
    </DropDownItem>
  )
}

const MemoToolbarItem = React.memo(ToolbarItem)

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
  const [toolbarState, setToolbarState] = React.useState<{
    activeItemKeys: string[]
    enabledGroup: boolean
    enabledItemKeys: string[]
  }>({
    activeItemKeys: [],
    enabledGroup: true,
    enabledItemKeys: [],
  })
  const deferredToolbarState = useDeferredValue(toolbarState)

  const editorConfigContext = useEditorConfigContext()
  const { items, key: groupKey } = group

  const runDeprioritized = useRunDeprioritized()

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

      setToolbarState({
        activeItemKeys: _activeItemKeys,
        enabledGroup: group.isEnabled
          ? group.isEnabled({ editor, editorConfigContext, selection })
          : true,
        enabledItemKeys: _enabledItemKeys,
      })

      if (onActiveChange) {
        onActiveChange({ activeItems: _activeItems })
      }
    })
  }, [editor, editorConfigContext, group, items, maxActiveItems, onActiveChange])

  useEffect(() => {
    // Run on mount in order to update states when dropdown is opened
    void runDeprioritized(updateStates)

    return mergeRegister(
      editor.registerUpdateListener(async () => {
        await runDeprioritized(updateStates)
      }),
    )
  }, [editor, runDeprioritized, updateStates])

  const renderedItems = useMemo(() => {
    return items?.length
      ? items.map((item) => (
          <MemoToolbarItem
            active={deferredToolbarState.activeItemKeys.includes(item.key)}
            anchorElem={anchorElem}
            editor={editor}
            enabled={deferredToolbarState.enabledItemKeys.includes(item.key)}
            item={item}
            key={item.key}
          />
        ))
      : null
  }, [items, deferredToolbarState, anchorElem, editor])

  return (
    <DropDown
      buttonAriaLabel={`${groupKey} dropdown`}
      buttonClassName={[baseClass, `${baseClass}-${groupKey}`, ...(classNames || [])]
        .filter(Boolean)
        .join(' ')}
      disabled={!deferredToolbarState.enabledGroup}
      dropdownKey={groupKey}
      Icon={Icon}
      itemsContainerClassNames={[`${baseClass}-items`, ...(itemsContainerClassNames || [])]}
      key={groupKey}
      label={label}
    >
      {renderedItems}
    </DropDown>
  )
}
