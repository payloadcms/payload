'use client'
import React, { useMemo } from 'react'

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
  const Component = useMemo(() => {
    return entry?.Component
      ? React.lazy(() =>
          entry.Component().then((resolvedComponent) => ({
            default: resolvedComponent,
          })),
        )
      : null
  }, [entry])

  const ChildComponent = useMemo(() => {
    return entry?.ChildComponent
      ? React.lazy(() =>
          entry.ChildComponent().then((resolvedChildComponent) => ({
            default: resolvedChildComponent,
          })),
        )
      : null
  }, [entry])

  if (entry.Component) {
    return (
      Component && (
        <React.Suspense>
          <Component anchorElem={anchorElem} editor={editor} entry={entry} key={entry.key} />
        </React.Suspense>
      )
    )
  }

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
