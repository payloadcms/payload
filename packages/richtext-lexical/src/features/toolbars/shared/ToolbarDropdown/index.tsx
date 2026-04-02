'use client'
import React, { useMemo } from 'react'

const baseClass = 'toolbar-popup__dropdown'

import type { LexicalEditor } from 'lexical'

import { useTranslation } from '@payloadcms/ui'

import type { ToolbarDropdownGroup, ToolbarGroupItem } from '../../types.js'
import type { ToolbarGroupState } from '../useToolbarStates.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
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
  groupState,
  Icon,
  itemsContainerClassNames,
  label,
}: {
  anchorElem: HTMLElement
  classNames?: string[]
  editor: LexicalEditor
  group: ToolbarDropdownGroup
  groupState: ToolbarGroupState
  Icon?: React.FC
  itemsContainerClassNames?: string[]
  label?: string
}) => {
  const { items, key: groupKey } = group

  const renderedItems = useMemo(() => {
    return items?.length
      ? items.map((item) => (
          <MemoToolbarItem
            active={groupState.activeItemKeys.includes(item.key)}
            anchorElem={anchorElem}
            editor={editor}
            enabled={groupState.enabledItemKeys.includes(item.key)}
            item={item}
            key={item.key}
          />
        ))
      : null
  }, [items, groupState.activeItemKeys, groupState.enabledItemKeys, anchorElem, editor])

  return (
    <DropDown
      buttonAriaLabel={`${groupKey} dropdown`}
      buttonClassName={[baseClass, `${baseClass}-${groupKey}`, ...(classNames || [])]
        .filter(Boolean)
        .join(' ')}
      disabled={!groupState.enabledGroup}
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
