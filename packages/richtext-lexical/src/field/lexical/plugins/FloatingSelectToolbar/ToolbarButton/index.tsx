'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { $getSelection } from 'lexical'
import React, { useCallback, useEffect, useState } from 'react'

import type { FloatingToolbarSectionEntry } from '../types'

import './index.scss'

const baseClass = 'floating-select-toolbar-popup__button'

export const ToolbarButton = ({
  children,
  entry,
}: {
  children: React.JSX.Element
  entry: FloatingToolbarSectionEntry
}) => {
  const [editor] = useLexicalComposerContext()
  const [enabled, setEnabled] = useState<boolean>(true)
  const [active, setActive] = useState<boolean>(false)
  const [className, setClassName] = useState<string>(baseClass)

  const updateStates = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (entry.isActive) {
        const isActive = entry.isActive({ editor, selection })
        if (active !== isActive) {
          setActive(isActive)
        }
      }
      if (entry.isEnabled) {
        const isEnabled = entry.isEnabled({ editor, selection })
        if (enabled !== isEnabled) {
          setEnabled(isEnabled)
        }
      }
    })
  }, [active, editor, enabled, entry])

  useEffect(() => {
    updateStates()
  }, [updateStates])

  useEffect(() => {
    document.addEventListener('mouseup', updateStates)
    return () => {
      document.removeEventListener('mouseup', updateStates)
    }
  }, [updateStates])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updateStates()
      }),
    )
  }, [editor, updateStates])

  useEffect(() => {
    setClassName(
      [
        baseClass,
        enabled === false ? 'disabled' : '',
        active ? 'active' : '',
        entry?.key ? `${baseClass}-` + entry.key : '',
      ]
        .filter(Boolean)
        .join(' '),
    )
  }, [enabled, active, className])

  return (
    <button
      className={className}
      onClick={() => {
        if (enabled !== false) {
          entry.onClick({
            editor,
            isActive: active,
          })
        }
      }}
      onMouseDown={(e) => {
        // This fixes a bug where you are unable to click the button if you are in a NESTED editor (editor in blocks field in editor).
        // Thus only happens if you click on the SVG of the button. Clicking on the outside works. Related issue: https://github.com/payloadcms/payload/issues/4025
        // TODO: Find out why exactly it happens and why e.preventDefault() on the mouseDown fixes it. Write that down here, or potentially fix a root cause, if there is any.
        e.preventDefault()
      }}
      type="button"
    >
      {children}
    </button>
  )
}
