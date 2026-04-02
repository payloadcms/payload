'use client'
import type { LexicalEditor } from 'lexical'

import { $addUpdateTag } from 'lexical'
import React, { useCallback, useMemo } from 'react'

import type { ToolbarGroupItem } from '../../types.js'

import './index.scss'

const baseClass = 'toolbar-popup__button'

export const ToolbarButton = ({
  active = false,
  children,
  editor,
  enabled = true,
  item,
}: {
  active?: boolean
  children: React.JSX.Element
  editor: LexicalEditor
  enabled?: boolean
  item: ToolbarGroupItem
}) => {
  const className = useMemo(() => {
    return [
      baseClass,
      !enabled ? 'disabled' : '',
      active ? 'active' : '',
      item.key ? `${baseClass}-${item.key}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }, [active, enabled, item.key])

  const handleClick = useCallback(() => {
    if (!enabled) {
      return
    }

    editor.focus(() => {
      editor.update(() => {
        $addUpdateTag('toolbar')
      })
      // We need to wrap the onSelect in the callback, so the editor is properly focused before the onSelect is called.
      item.onSelect?.({
        editor,
        isActive: active,
      })
    })
  }, [editor, item, active, enabled])

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
