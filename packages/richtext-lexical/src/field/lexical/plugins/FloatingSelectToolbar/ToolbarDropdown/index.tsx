'use client'
import React from 'react'

const baseClass = 'floating-select-toolbar-popup__dropdown'

import type { LexicalEditor } from 'lexical'

import type { FloatingToolbarSectionEntry } from '../types'

import { DropDown, DropDownItem } from './DropDown'
import './index.scss'

export const ToolbarDropdown = ({
  Icon,
  anchorElem,
  classNames,
  editor,
  entries,
}: {
  Icon?: React.FC
  anchorElem: HTMLElement
  classNames?: string[]
  editor: LexicalEditor
  entries: FloatingToolbarSectionEntry[]
}) => {
  return (
    <DropDown
      Icon={Icon}
      buttonAriaLabel="Formatting options"
      buttonClassName={[baseClass, ...(classNames || [])].filter(Boolean).join(' ')}
    >
      {entries.length &&
        entries.map((entry) => {
          if (entry.Component) {
            return (
              <entry.Component
                anchorElem={anchorElem}
                editor={editor}
                entry={entry}
                key={entry.key}
              />
            )
          }
          return (
            <DropDownItem entry={entry} key={entry.key}>
              <entry.ChildComponent />
              <span className="text">{entry.label}</span>
            </DropDownItem>
          )
        })}
    </DropDown>
  )
}
