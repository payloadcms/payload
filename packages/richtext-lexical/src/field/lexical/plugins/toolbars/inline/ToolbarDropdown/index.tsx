'use client'
import React from 'react'

const baseClass = 'inline-toolbar-popup__dropdown'

import type { LexicalEditor } from 'lexical'

import type { InlineToolbarGroupItem } from '../types.js'

import { DropDown, DropDownItem } from './DropDown.js'
import './index.scss'

export const ToolbarItem = ({
  anchorElem,
  editor,
  item,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  item: InlineToolbarGroupItem
}) => {
  if (item.Component) {
    return (
      item?.Component && (
        <item.Component anchorElem={anchorElem} editor={editor} item={item} key={item.key} />
      )
    )
  }

  return (
    <DropDownItem item={item} key={item.key}>
      {item?.ChildComponent && <item.ChildComponent />}
      <span className="text">{item.label}</span>
    </DropDownItem>
  )
}

export const ToolbarDropdown = ({
  Icon,
  anchorElem,
  classNames,
  editor,
  groupKey,
  items,
}: {
  Icon?: React.FC
  anchorElem: HTMLElement
  classNames?: string[]
  editor: LexicalEditor
  groupKey: string
  items: InlineToolbarGroupItem[]
}) => {
  return (
    <DropDown
      Icon={Icon}
      buttonAriaLabel={`${groupKey} dropdown`}
      buttonClassName={[baseClass, `${baseClass}-${groupKey}`, ...(classNames || [])]
        .filter(Boolean)
        .join(' ')}
      key={groupKey}
    >
      {items.length &&
        items.map((item) => {
          return <ToolbarItem anchorElem={anchorElem} editor={editor} item={item} key={item.key} />
        })}
    </DropDown>
  )
}
