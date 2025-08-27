'use client'
import type { LexicalEditor } from 'lexical'

import { mergeRegister } from '@lexical/utils'
import { $addUpdateTag, $getSelection } from 'lexical'
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'

import type { ToolbarGroupItem } from '../../types.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import './index.scss'
import { useRunDeprioritized } from '../../../../utilities/useRunDeprioritized.js'

const baseClass = 'toolbar-popup__button'

export const ToolbarButton = ({
  children,
  editor,
  item,
}: {
  children: React.JSX.Element
  editor: LexicalEditor
  item: ToolbarGroupItem
}) => {
  const [_state, setState] = useState({ active: false, enabled: true })
  const deferredState = useDeferredValue(_state)

  const editorConfigContext = useEditorConfigContext()

  const className = useMemo(() => {
    return [
      baseClass,
      !deferredState.enabled ? 'disabled' : '',
      deferredState.active ? 'active' : '',
      item.key ? `${baseClass}-${item.key}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }, [deferredState, item.key])
  const updateStates = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!selection) {
        return
      }
      const newActive = item.isActive
        ? item.isActive({ editor, editorConfigContext, selection })
        : false

      const newEnabled = item.isEnabled
        ? item.isEnabled({ editor, editorConfigContext, selection })
        : true

      setState((prev) => {
        if (prev.active === newActive && prev.enabled === newEnabled) {
          return prev
        }
        return { active: newActive, enabled: newEnabled }
      })
    })
  }, [editor, editorConfigContext, item])

  const runDeprioritized = useRunDeprioritized()

  useEffect(() => {
    // Run on mount
    void runDeprioritized(updateStates)

    const listener = () => runDeprioritized(updateStates)

    const cleanup = mergeRegister(editor.registerUpdateListener(listener))
    document.addEventListener('mouseup', listener)

    return () => {
      cleanup()
      document.removeEventListener('mouseup', listener)
    }
  }, [editor, runDeprioritized, updateStates])

  const handleClick = useCallback(() => {
    if (!_state.enabled) {
      return
    }

    editor.focus(() => {
      editor.update(() => {
        $addUpdateTag('toolbar')
      })
      // We need to wrap the onSelect in the callback, so the editor is properly focused before the onSelect is called.
      item.onSelect?.({
        editor,
        isActive: _state.active,
      })
    })
  }, [editor, item, _state])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // This fixes a bug where you are unable to click the button if you are in a NESTED editor (editor in blocks field in editor).
    // Thus only happens if you click on the SVG of the button. Clicking on the outside works. Related issue: https://github.com/payloadcms/payload/issues/4025
    // TODO: Find out why exactly it happens and why e.preventDefault() on the mouseDown fixes it. Write that down here, or potentially fix a root cause, if there is any.
    e.preventDefault()
  }, [])

  return (
    <button
      className={className}
      data-button-key={item.key}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      type="button"
    >
      {children}
    </button>
  )
}
