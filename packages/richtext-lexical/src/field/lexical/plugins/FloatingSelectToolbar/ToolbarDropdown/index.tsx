'use client'
import React from 'react'

const baseClass = 'floating-select-toolbar-popup__dropdown'

import type { LexicalEditor } from 'lexical'

import type { FloatingToolbarSectionEntry } from '../types.js'

import { DropDown, DropDownItem } from './DropDown.js'
import './index.scss'

export const ToolbarEntry = ({
  anchorElem,
  editor,
  entry,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  entry: FloatingToolbarSectionEntry
}) => {
  if (entry.Component) {
    return (
      entry?.Component && (
        <entry.Component anchorElem={anchorElem} editor={editor} entry={entry} key={entry.key} />
      )
    )
  }

  return (
    <DropDownItem entry={entry} key={entry.key}>
      {entry?.ChildComponent && <entry.ChildComponent />}
      <span className="text">{entry.label}</span>
    </DropDownItem>
  )
}

export const ToolbarDropdown = ({
  Icon,
  anchorElem,
  classNames,
  editor,
  entries,
  sectionKey,
}: {
  Icon?: React.FC
  anchorElem: HTMLElement
  classNames?: string[]
  editor: LexicalEditor
  entries: FloatingToolbarSectionEntry[]
  sectionKey: string
}) => {
  return (
    <DropDown
      Icon={Icon}
      buttonAriaLabel={`${sectionKey} dropdown`}
      buttonClassName={[baseClass, `${baseClass}-${sectionKey}`, ...(classNames || [])]
        .filter(Boolean)
        .join(' ')}
      key={sectionKey}
    >
      {entries.length &&
        entries.map((entry) => {
          return (
            <ToolbarEntry anchorElem={anchorElem} editor={editor} entry={entry} key={entry.key} />
          )
        })}
    </DropDown>
  )
}
