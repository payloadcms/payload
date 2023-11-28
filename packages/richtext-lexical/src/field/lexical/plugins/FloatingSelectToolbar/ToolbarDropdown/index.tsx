'use client'
import React from 'react'

const baseClass = 'floating-select-toolbar-popup__dropdown'

import type { LexicalEditor } from 'lexical'

import type { FloatingToolbarSectionEntry } from '../types'

import { DropDown, DropDownItem } from './DropDown'
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
    const Component = entry?.Component
      ? React.lazy(() =>
          entry.Component().then((resolvedComponent) => ({
            default: resolvedComponent,
          })),
        )
      : null
    return (
      Component && (
        <React.Suspense>
          <Component anchorElem={anchorElem} editor={editor} entry={entry} key={entry.key} />
        </React.Suspense>
      )
    )
  }

  const ChildComponent = entry?.ChildComponent
    ? React.lazy(() =>
        entry.ChildComponent().then((resolvedChildComponent) => ({
          default: resolvedChildComponent,
        })),
      )
    : null
  return (
    <DropDownItem entry={entry} key={entry.key}>
      {ChildComponent && (
        <React.Suspense>
          <ChildComponent />
        </React.Suspense>
      )}
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
          return (
            <ToolbarEntry anchorElem={anchorElem} editor={editor} entry={entry} key={entry.key} />
          )
        })}
    </DropDown>
  )
}
