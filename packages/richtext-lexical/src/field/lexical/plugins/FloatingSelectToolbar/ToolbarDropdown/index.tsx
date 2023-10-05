import React from 'react'

const baseClass = 'floating-select-toolbar-popup__dropdown'

import type { FloatingToolbarSectionEntry } from '../types'

import { DropDown, DropDownItem } from './DropDown'
import './index.scss'

export const ToolbarDropdown = ({
  Icon,
  classNames,
  entries,
}: {
  Icon?: React.FC
  classNames?: string[]
  entries: FloatingToolbarSectionEntry[]
}) => {
  return (
    <DropDown
      Icon={Icon}
      buttonAriaLabel="Formatting options"
      buttonClassName={[baseClass, ...(classNames || [])].filter(Boolean).join(' ')}
    >
      {entries.length &&
        entries.map((entry) => (
          <DropDownItem entry={entry} key={entry.key}>
            <entry.ChildComponent />
            <span className="text">{entry.label}</span>
          </DropDownItem>
        ))}
    </DropDown>
  )
}
