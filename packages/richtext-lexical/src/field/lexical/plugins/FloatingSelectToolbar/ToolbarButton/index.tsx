'use client'
import React, { useCallback, useEffect, useState } from 'react'

const baseClass = 'floating-select-toolbar-popup__button'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { $getSelection } from 'lexical'

import type { FloatingToolbarSectionEntry } from '../types'

import './index.scss'

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
      [baseClass, enabled === false ? 'disabled' : '', active ? 'active' : '']
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
      type="button"
    >
      {children}
    </button>
  )
}
